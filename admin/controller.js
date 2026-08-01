// admin/controller.js — Full CRUD + Reports, Feedback, Grievances, Calendar, Community, Activities, Complaints, HomeRecords

const Student        = require('../student/models/student');
const StaffMember    = require('../models/StaffMember');
const Expense        = require('../models/Expense');
const Post           = require('../models/Post');
const FinanceKPI     = require('../models/FinanceKPI');
const AuditLog       = require('../models/AuditLog');
const Feedback       = require('../models/Feedback');
const Grievance      = require('../models/Grievance');
const CalendarEvent  = require('../models/CalendarEvent');
const PendingPost    = require('../warden/models/pendingPost');
const LivePost       = require('../warden/models/post');
const Activity       = require('../warden/models/activity');
const PendingActivity = require('../warden/models/pendingActivity');
const WardenComplaint = require('../warden/models/complaints');
const HomeRecord     = require('../models/HomeRecord');
const Hostel         = require('../models/Hostel');
const { sendSoSAlert } = require('../utils/mailer');

function adminInfo(req) { return { adminId: req.user.id, adminName: req.user.auth_id }; }

async function log(req, action, targetType, targetId, targetName, before, after) {
  try { await AuditLog.create({ ...adminInfo(req), action, targetType, targetId: String(targetId), targetName, before, after }); }
  catch { /* audit failures must not break main op */ }
}

// ── Overview ──────────────────────────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    const [totalStudents, activeStaff, pendingExpenses, pendingPosts, staffAll, staffLeft12mo, openSoS] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      StaffMember.countDocuments({ status: 'active' }),
      Expense.countDocuments({ status: 'pending' }),
      Post.countDocuments({ status: 'pending' }),
      StaffMember.countDocuments(),
      StaffMember.countDocuments({ leftOn: { $gte: new Date(Date.now() - 365*24*60*60*1000) } }),
      Grievance.countDocuments({ type: 'sos', status: { $in: ['open','in_progress'] } }),
    ]);
    const avgHeadcount = staffAll || 1;
    const volunteerTurnoverRatio = +(((staffLeft12mo / avgHeadcount) * 100).toFixed(1));
    const in30days = new Date(Date.now() + 30*24*60*60*1000);
    const certAlerts = await StaffMember.countDocuments({ 'certifications.expiresOn': { $lte: in30days, $gte: new Date() } });
    const homeDist = await Student.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$home', count: { $sum: 1 } } }
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expensesThisMonth = await Expense.aggregate([
      { $match: { date: { $gte: monthStart }, status: { $in: ['approved','paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    // monthly expenses for chart (last 6 months)
    const monthlyTrend = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return Expense.aggregate([
          { $match: { date: { $gte: start, $lte: end }, status: { $in: ['approved','paid'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => ({
          month: start.toLocaleString('en-IN', { month: 'short' }),
          total: r[0]?.total || 0
        }));
      })
    );
    // student status breakdown for pie chart
    const statusBreakdown = await Student.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({
      totalStudents, activeStaff, pendingExpenses, pendingPosts,
      volunteerTurnoverRatio, certAlerts, openSoS,
      expensesThisMonth: expensesThisMonth[0]?.total || 0,
      homeDistribution: homeDist.map(h => ({ home: h._id, count: h.count })),
      monthlyTrend,
      statusBreakdown: statusBreakdown.map(s => ({ name: s._id, value: s.count })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Students ──────────────────────────────────────────────────────────────────
exports.listStudents = async (req, res) => {
  try {
    const { home, status, search, class: cls, ageMin, ageMax } = req.query;
    const filter = {};
    if (home) {
      const hostels = await Hostel.find({ name: new RegExp(home, 'i') });
      if (hostels.length > 0) filter.hostelName = { $in: hostels.map(h => h._id) };
      else filter.hostelName = null;
    }
    if (status) filter.status = status;
    if (cls)    filter.class = cls;
    if (search) filter.$or = [{ name: new RegExp(search,'i') }, { studentId: new RegExp(search,'i') }];
    if (ageMin || ageMax) {
      const now = new Date();
      filter.DOB = {};
      if (ageMax) filter.DOB.$gte = new Date(now.getFullYear() - Number(ageMax), now.getMonth(), now.getDate());
      if (ageMin) filter.DOB.$lte = new Date(now.getFullYear() - Number(ageMin), now.getMonth(), now.getDate());
    }
    const students = await Student.find(filter).populate('hostelName', 'name').sort({ createdAt: -1 }).lean();
    
    // Map hostelName to home for frontend compatibility
    const mapped = students.map(s => {
      s.home = s.hostelName ? s.hostelName.name : 'Outside';
      return s;
    });
    res.json(mapped);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addStudent = async (req, res) => {
  try {
    const payload = { ...req.body, verifiedBy: req.user.auth_id };
    if (payload.home) {
      const h = await Hostel.findOne({ name: new RegExp(payload.home, 'i') });
      if (h) payload.hostelName = h._id;
    }
    const student = await Student.create(payload);
    await log(req,'ADD_STUDENT','student',student._id,student.name,null,student.toObject());
    res.status(201).json(student);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.updateStudent = async (req, res) => {
  try {
    const before = await Student.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Student not found' });
    
    const payload = { ...req.body };
    if (payload.home) {
      const h = await Hostel.findOne({ name: new RegExp(payload.home, 'i') });
      if (h) payload.hostelName = h._id;
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' }).populate('hostelName', 'name').lean();
    if (updated && updated.hostelName) updated.home = updated.hostelName.name;
    else if (updated) updated.home = 'Outside';
    
    await log(req,'EDIT_STUDENT','student',updated._id,updated.name,before,updated);
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.deactivateStudent = async (req, res) => {
  try {
    const before = await Student.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Student not found' });
    const updated = await Student.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { returnDocument: 'after' });
    await log(req,'DEACTIVATE_STUDENT','student',updated._id,updated.name,before,{ status:'inactive' });
    res.json({ message: 'Student deactivated', student: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Staff ─────────────────────────────────────────────────────────────────────
exports.listStaff = async (req, res) => {
  try {
    const { house, status, role } = req.query;
    const filter = {};
    if (house)  filter.house = house;
    if (status) filter.status = status;
    if (role)   filter.role = role;
    res.json(await StaffMember.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addStaff = async (req, res) => {
  try {
    const staff = await StaffMember.create(req.body);
    await log(req,'ADD_STAFF','staff',staff._id,staff.name,null,staff.toObject());
    res.status(201).json(staff);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.updateStaff = async (req, res) => {
  try {
    const before = await StaffMember.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Staff not found' });
    const updated = await StaffMember.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await log(req,'EDIT_STAFF','staff',updated._id,updated.name,before,updated.toObject());
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.deactivateStaff = async (req, res) => {
  try {
    const before = await StaffMember.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Staff not found' });
    const updated = await StaffMember.findByIdAndUpdate(req.params.id, { status:'inactive', leftOn: new Date() }, { returnDocument: 'after' });
    await log(req,'DEACTIVATE_STAFF','staff',updated._id,updated.name,before,{ status:'inactive' });
    res.json({ message: 'Staff deactivated', staff: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Expenses ──────────────────────────────────────────────────────────────────
exports.listExpenses = async (req, res) => {
  try {
    const { home, status, category } = req.query;
    const filter = {};
    if (home)     filter.home = home;
    if (status)   filter.status = status;
    if (category) filter.category = category;
    res.json(await Expense.find(filter).sort({ date: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, submittedBy: req.user.auth_id });
    await log(req,'ADD_EXPENSE','expense',expense._id,expense.title,null,expense.toObject());
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.updateExpense = async (req, res) => {
  try {
    const before = await Expense.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Expense not found' });
    const updates = { ...req.body };
    if (updates.status === 'approved') updates.approvedBy = req.user.auth_id;
    if (updates.status === 'rejected') updates.rejectedBy = req.user.auth_id;
    const updated = await Expense.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    const action = updates.status ? `${updates.status.toUpperCase()}_EXPENSE` : 'EDIT_EXPENSE';
    await log(req,action,'expense',updated._id,updated.title,before,updated.toObject());
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await log(req,'DELETE_EXPENSE','expense',expense._id,expense.title,expense.toObject(),null);
    res.json({ message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Finance KPIs ──────────────────────────────────────────────────────────────
exports.getFinanceKPIs = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const kpis = await FinanceKPI.find({ year: Number(year) }).sort({ month: 1 });
    const enriched = kpis.map(k => {
      const variance = k.actualExpenses - k.budget;
      const fundraisingROI = k.fundraisingCost > 0 ? +(((k.donations - k.fundraisingCost) / k.fundraisingCost)*100).toFixed(1) : null;
      const impactPerDollar = k.donations > 0 ? +(k.beneficiariesServed / k.donations).toFixed(4) : null;
      return { ...k.toObject(), variance, fundraisingROI, impactPerDollar };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.upsertFinanceKPI = async (req, res) => {
  try {
    const { year, month, home } = req.body;
    const before = await FinanceKPI.findOne({ year, month, home }).lean();
    const kpi = await FinanceKPI.findOneAndUpdate({ year, month, home }, req.body, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true });
    await log(req, before ? 'EDIT_KPI' : 'ADD_KPI', 'kpi', kpi._id, `${home} ${month}/${year}`, before, kpi.toObject());
    res.json(kpi);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ── Posts ─────────────────────────────────────────────────────────────────────
exports.listPosts = async (req, res) => {
  try {
    const { status, home } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (home)   filter.home = home;
    res.json(await Post.find(filter).sort({ submittedOn: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addPost = async (req, res) => {
  try {
    const post = await Post.create(req.body);
    await log(req,'ADD_POST','post',post._id,post.studentName,null,post.toObject());
    res.status(201).json(post);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.reviewPost = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const before = await Post.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Post not found' });
    const updated = await Post.findByIdAndUpdate(req.params.id,
      { status, rejectionReason: rejectionReason||'', reviewedBy: req.user.auth_id, reviewedOn: new Date() },
      { returnDocument: 'after' });
    await log(req,`${status.toUpperCase()}_POST`,'post',updated._id,updated.studentName,before,updated.toObject());
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await log(req,'DELETE_POST','post',post._id,post.studentName,post.toObject(),null);
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, adminId, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (action)     filter.action = new RegExp(action,'i');
    if (targetType) filter.targetType = targetType;
    if (adminId)    filter.adminId = adminId;
    const skip = (Number(page)-1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Reports ───────────────────────────────────────────────────────────────────
exports.getReportSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), home } = req.query;
    const yr = Number(year);
    const yearStart = new Date(yr, 0, 1);
    const yearEnd   = new Date(yr, 11, 31, 23, 59, 59);
    const expFilter = { date: { $gte: yearStart, $lte: yearEnd } };
    if (home) expFilter.home = home;

    const [
      totalStudents, activeStaff, totalExpenses,
      byCategory, byHome, byMonth, byStatus,
      feedbackCount, grievanceCount
    ] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      StaffMember.countDocuments({ status: 'active' }),
      Expense.aggregate([{ $match: expFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: expFilter }, { $group: { _id: '$category', total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: expFilter }, { $group: { _id: '$home', total: { $sum: '$amount' } } }]),
      Expense.aggregate([
        { $match: expFilter },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
      ]),
      Expense.aggregate([{ $match: expFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Feedback.countDocuments(),
      Grievance.countDocuments(),
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json({
      year: yr, totalStudents, activeStaff,
      totalExpenses: totalExpenses[0]?.total || 0,
      byCategory: byCategory.map(c => ({ name: c._id || 'Other', value: c.total })),
      byHome: byHome.map(h => ({ name: h._id || 'Unknown', value: h.total })),
      byMonth: MONTHS.map((m, i) => {
        const found = byMonth.find(b => b._id === i+1);
        return { month: m, total: found?.total || 0 };
      }),
      byStatus: byStatus.map(s => ({ name: s._id, count: s.count })),
      feedbackCount, grievanceCount,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Feedback ──────────────────────────────────────────────────────────────────
exports.listFeedback = async (req, res) => {
  try {
    const { status, role, category } = req.query;
    const filter = {};
    if (status)   filter.status = status;
    if (role)     filter.role = role;
    if (category) filter.category = category;
    res.json(await Feedback.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addFeedback = async (req, res) => {
  try {
    const fb = await Feedback.create(req.body);
    res.status(201).json(fb);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.reviewFeedback = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const updated = await Feedback.findByIdAndUpdate(req.params.id,
      { status, reviewNote, reviewedBy: req.user.auth_id }, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ── Grievances ────────────────────────────────────────────────────────────────
exports.listGrievances = async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const filter = {};
    if (status)   filter.status = status;
    if (type)     filter.type = type;
    if (priority) filter.priority = priority;
    res.json(await Grievance.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addGrievance = async (req, res) => {
  try {
    const grievance = await Grievance.create(req.body);
    // Send email alert for SoS or help requests
    const sent = await sendSoSAlert(grievance);
    if (sent) await Grievance.findByIdAndUpdate(grievance._id, { emailSent: true });
    res.status(201).json(grievance);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.updateGrievance = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'resolved') { updates.resolvedBy = req.user.auth_id; updates.resolvedAt = new Date(); }
    const updated = await Grievance.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// ── Calendar ──────────────────────────────────────────────────────────────────
const INDIA_HOLIDAYS_2025 = [
  { title: "Republic Day",       date: "2025-01-26", type: "holiday", color: "#f97316" },
  { title: "Holi",               date: "2025-03-14", type: "holiday", color: "#ec4899" },
  { title: "Good Friday",        date: "2025-04-18", type: "holiday", color: "#6366f1" },
  { title: "Eid ul-Fitr",        date: "2025-03-31", type: "holiday", color: "#10b981" },
  { title: "Ambedkar Jayanti",   date: "2025-04-14", type: "holiday", color: "#3b82f6" },
  { title: "Labour Day",         date: "2025-05-01", type: "holiday", color: "#f59e0b" },
  { title: "Eid ul-Adha",        date: "2025-06-07", type: "holiday", color: "#10b981" },
  { title: "Independence Day",   date: "2025-08-15", type: "holiday", color: "#f97316" },
  { title: "Janmashtami",        date: "2025-08-16", type: "holiday", color: "#8b5cf6" },
  { title: "Gandhi Jayanti",     date: "2025-10-02", type: "holiday", color: "#f97316" },
  { title: "Diwali",             date: "2025-10-20", type: "holiday", color: "#f59e0b" },
  { title: "Christmas",          date: "2025-12-25", type: "holiday", color: "#ef4444" },
  { title: "World Children's Day", date: "2025-11-20", type: "ngo",  color: "#06b6d4" },
  { title: "International Women's Day", date: "2025-03-08", type: "ngo", color: "#ec4899" },
  { title: "World Mental Health Day",   date: "2025-10-10", type: "ngo", color: "#6366f1" },
];

exports.getCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month && year) {
      const start = new Date(Number(year), Number(month)-1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
    const dbEvents = await CalendarEvent.find(filter).sort({ date: 1 });

    // Auto-generate birthday events from students and staff with DOB
    const students = await Student.find({ DOB: { $exists: true, $ne: null }, status: 'active' }).select('name DOB home _id');
    const staff    = await StaffMember.find({ status: 'active' }).select('name joinedOn _id');

    const currentYear = Number(year) || new Date().getFullYear();
    const targetMonth = month ? Number(month) : null;

    const birthdayEvents = students
      .filter(s => s.DOB)
      .map(s => {
        const dob = new Date(s.DOB);
        const eventDate = new Date(currentYear, dob.getMonth(), dob.getDate());
        return { _id: `bday-s-${s._id}`, title: `🎂 ${s.name}'s Birthday`, date: eventDate.toISOString(),
          type: 'birthday', color: '#f472b6', home: s.home, linkedId: String(s._id), linkedRole: 'student', isRecurring: true };
      })
      .filter(e => !targetMonth || new Date(e.date).getMonth() + 1 === targetMonth);

    // Indian holidays (static, filtered by month if requested)
    const holidays = INDIA_HOLIDAYS_2025.filter(h => {
      if (!targetMonth) return true;
      return new Date(h.date).getMonth() + 1 === targetMonth;
    }).map(h => ({ ...h, _id: `holiday-${h.date}`, isRecurring: false }));

    const allEvents = [
      ...dbEvents.map(e => e.toObject()),
      ...birthdayEvents,
      ...holidays,
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(allEvents);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, createdBy: req.user.auth_id });
    await log(req,'ADD_CALENDAR_EVENT','calendar',event._id,event.title,null,event.toObject());
    res.status(201).json(event);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await log(req,'DELETE_CALENDAR_EVENT','calendar',event._id,event.title,event.toObject(),null);
    res.json({ message: 'Event deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listPendingPosts = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    // We import CommunityPost dynamically since it wasn't at the top of the file
    const CommunityPost = require('../models/CommunityPost');
    const filter = { status };
    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 });

    const mapped = posts.map(p => ({
      _id: p._id,
      content: p.content,
      type: "text",
      tags: [],
      pollOptions: [],
      creatorName: p.author,
      creatorRole: p.role,
      hostelName: "Unknown", 
      status: p.status || 'pending',
      rejectionReason: "",
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      createdAt: p.createdAt
    }));

    res.json(mapped);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.reviewPendingPost = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
      
    const CommunityPost = require('../models/CommunityPost');
    const pending = await CommunityPost.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: 'Post not found' });

    pending.status = status;
    pending.isVerified = (status === 'approved');
    await pending.save();

    await log(req, `${status.toUpperCase()}_POST`, 'community', pending._id, pending.content.slice(0,40), null, { status });
    res.json({ message: `Post ${status}`, pending });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deletePendingPost = async (req, res) => {
  try {
    const CommunityPost = require('../models/CommunityPost');
    const p = await CommunityPost.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Community — Live Posts ────────────────────────────────────────────────────
exports.listLivePosts = async (req, res) => {
  try {
    const { hostelName, type } = req.query;
    const filter = {};
    if (hostelName) filter.hostelName = hostelName;
    if (type)       filter.type = type;
    const rawPosts = await LivePost.find(filter)
      .populate('hostelName')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    const posts = rawPosts.map(p => ({
      _id: p._id,
      content: p.content,
      type: p.type || "text",
      tags: p.tags || [],
      pollOptions: p.pollOptions || [],
      creatorName: p.author || 'Unknown',
      creatorRole: p.creatorRole || 'admin',
      hostelName: p.hostelName ? p.hostelName.name : 'Unknown',
      pinned: p.pinned || false,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      createdAt: p.date || p.createdAt
    }));

    const CommunityPost = require('../models/CommunityPost');
    const cpFilter = { isVerified: true };
    if (hostelName) cpFilter.hostelName = hostelName; // CommunityPost doesn't have hostelName, but if it did...
    
    const communityPosts = await CommunityPost.find({ isVerified: true }).sort({ createdAt: -1 }).lean();

    const mappedCommunityPosts = communityPosts.map(cp => ({
      _id: cp._id,
      content: cp.content,
      type: "text",
      tags: cp.category ? [cp.category] : [],
      pollOptions: [],
      creatorName: cp.author,
      creatorRole: cp.role,
      hostelName: "Unknown", 
      status: "approved",
      pinned: false,
      mediaUrl: cp.mediaUrl,
      mediaType: cp.mediaType,
      createdAt: cp.createdAt
    }));

    const allPosts = [...posts, ...mappedCommunityPosts].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      // Pinned posts first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return dateB - dateA;
    });

    res.json(allPosts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createLivePost = async (req, res) => {
  try {
    const post = await LivePost.create({ ...req.body, creatorName: req.user.auth_id, creatorRole: 'admin', approvedBy: req.user.auth_id });
    await log(req, 'CREATE_LIVE_POST', 'community', post._id, post.content.slice(0,40), null, post.toObject());
    res.status(201).json(post);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateLivePost = async (req, res) => {
  try {
    const before = await LivePost.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Not found' });
    const updated = await LivePost.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await log(req, 'EDIT_LIVE_POST', 'community', updated._id, updated.content.slice(0,40), before, updated.toObject());
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteLivePost = async (req, res) => {
  try {
    const post = await LivePost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    await log(req, 'DELETE_LIVE_POST', 'community', post._id, post.content.slice(0,40), post.toObject(), null);
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.togglePinPost = async (req, res) => {
  try {
    const post = await LivePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    post.pinned = !post.pinned;
    await post.save();
    await log(req, post.pinned ? 'PIN_POST' : 'UNPIN_POST', 'community', post._id, post.content.slice(0,40), null, { pinned: post.pinned });
    res.json({ message: post.pinned ? 'Post pinned' : 'Post unpinned', pinned: post.pinned });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Activities — Pending ──────────────────────────────────────────────────────
exports.listPendingActivities = async (req, res) => {
  try {
    const { status = 'pending', hostelName } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (hostelName) filter.hostelName = hostelName;
    res.json(await PendingActivity.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.reviewPendingActivity = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const pending = await PendingActivity.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: 'Activity not found' });

    pending.status = status;
    pending.reviewedBy = req.user.auth_id;
    pending.reviewedAt = new Date();
    pending.rejectionReason = rejectionReason || '';
    await pending.save();

    if (status === 'approved') {
      await Activity.create({
        title:         pending.title,
        description:   pending.description,
        requestedBy:   pending.requestedBy,
        requesterRole: pending.requesterRole,
        date:          pending.date,
        time:          pending.time,
        location:      pending.location,
        category:      pending.category,
        hostelName:    pending.hostelName,
        creator:       pending.creatorId || pending.creator, // fallback in case it's named creator
        approvedBy:    req.user.auth_id,
        status:        'upcoming',
      });
    }
    await log(req, `${status.toUpperCase()}_ACTIVITY`, 'activity', pending._id, pending.title, null, { status });
    res.json({ message: `Activity ${status}`, pending });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deletePendingActivity = async (req, res) => {
  try {
    const a = await PendingActivity.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Activities — Live ─────────────────────────────────────────────────────────
exports.listActivities = async (req, res) => {
  try {
    const { category, status, hostelName } = req.query;
    const filter = {};
    if (category)   filter.category = category;
    if (status)     filter.status = status;
    if (hostelName) filter.hostelName = hostelName;
    res.json(await Activity.find(filter).sort({ date: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, approvedBy: req.user.auth_id, requestedBy: req.user.auth_id, requesterRole: 'Admin' });
    await log(req, 'CREATE_ACTIVITY', 'activity', activity._id, activity.title, null, activity.toObject());
    res.status(201).json(activity);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateActivity = async (req, res) => {
  try {
    const before = await Activity.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Not found' });
    const updated = await Activity.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await log(req, 'EDIT_ACTIVITY', 'activity', updated._id, updated.title, before, updated.toObject());
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteActivity = async (req, res) => {
  try {
    const a = await Activity.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    await log(req, 'DELETE_ACTIVITY', 'activity', a._id, a.title, a.toObject(), null);
    res.json({ message: 'Activity deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Complaints ────────────────────────────────────────────────────────────────
exports.listComplaints = async (req, res) => {
  try {
    const { status, priority, role, hostelName } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (priority)   filter.priority = priority;
    if (role)       filter.role = role;
    if (hostelName) filter.hostelName = hostelName;
    res.json(await WardenComplaint.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { resolvedReason } = req.body;
    const now = new Date();
    const complaint = await WardenComplaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'RESOLVED',
        'timeline.resolvedDate':   now,
        'timeline.resolvedTime':   now.toTimeString().slice(0, 5),
        'timeline.resolvedReason': resolvedReason || 'Resolved by admin',
      },
      { returnDocument: 'after' }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    
    // Sync with Student complaint if applicable
    try {
      const User = require('../models/User');
      const StudentComplaint = require('../student/models/complaints');
      const user = await User.findById(complaint.creator);
      if (user) {
        await StudentComplaint.updateMany(
          { auth_id: user.auth_id, message: complaint.description },
          { status: 'resolved' }
        );
      }
    } catch (e) {
      console.error("Failed to sync status to student complaint:", e);
    }

    await log(req, 'RESOLVE_COMPLAINT', 'complaint', complaint._id, complaint.title, null, { status: 'RESOLVED' });
    res.json(complaint);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.escalateComplaint = async (req, res) => {
  try {
    const { escalatedReason } = req.body;
    const now = new Date();
    const complaint = await WardenComplaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'ESCALATED',
        'timeline.escalatedDate':   now,
        'timeline.escalatedTime':   now.toTimeString().slice(0, 5),
        'timeline.escalatedReason': escalatedReason || 'Escalated by admin',
      },
      { returnDocument: 'after' }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });

    // Sync with Student complaint if applicable
    try {
      const User = require('../models/User');
      const StudentComplaint = require('../student/models/complaints');
      const user = await User.findById(complaint.creator);
      if (user) {
        await StudentComplaint.updateMany(
          { auth_id: user.auth_id, message: complaint.description },
          { status: 'escalated' }
        );
      }
    } catch (e) {
      console.error("Failed to sync status to student complaint:", e);
    }

    await log(req, 'ESCALATE_COMPLAINT', 'complaint', complaint._id, complaint.title, null, { status: 'ESCALATED' });
    res.json(complaint);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const c = await WardenComplaint.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Complaint deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ══════════════════════════════════════════════════════════════════════════════
// HOME RECORDS  (JJ Act Rule 21 & 22 — Ministry of WCD compliance)
// ══════════════════════════════════════════════════════════════════════════════

/** GET /admin/home-records
 *  Filters: home, category, fileType, childId, status
 */
exports.listHomeRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.home)     filter.home     = req.query.home;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.fileType) filter.fileType = req.query.fileType;
    if (req.query.childId)  filter.childId  = req.query.childId;
    if (req.query.status)   filter.status   = req.query.status;
    const records = await HomeRecord.find(filter).sort({ home: 1, category: 1, childName: 1 });
    res.json(records);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** POST /admin/home-records — create a new register or file */
exports.addHomeRecord = async (req, res) => {
  try {
    const { home, category, title, fileType, childId, childName,
            maintainedBy, notes, status } = req.body;
    if (!home || !category || !title || !fileType)
      return res.status(400).json({ message: 'home, category, title, fileType are required' });

    const record = await HomeRecord.create({
      home, category, title, fileType,
      childId, childName, maintainedBy, notes,
      status: status || 'active',
      createdBy: req.user.auth_id,
      ruleReference: 'JJ Model Rules 2016, Rule 21 & 22',
    });
    await log(req, 'ADD_HOME_RECORD', 'home_record', record._id, record.title, null, record.toObject());
    res.status(201).json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** PUT /admin/home-records/:id — update metadata */
exports.updateHomeRecord = async (req, res) => {
  try {
    const before = await HomeRecord.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Record not found' });
    const allowed = ['title','status','maintainedBy','notes','lastInspectedOn','inspectedBy','updatedBy'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    update.updatedBy = req.user.auth_id;
    const after = await HomeRecord.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    await log(req, 'UPDATE_HOME_RECORD', 'home_record', after._id, after.title, before, after.toObject());
    res.json(after);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** DELETE /admin/home-records/:id */
exports.deleteHomeRecord = async (req, res) => {
  try {
    const r = await HomeRecord.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Record not found' });
    await log(req, 'DELETE_HOME_RECORD', 'home_record', r._id, r.title, r.toObject(), null);
    res.json({ message: 'Home record deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** POST /admin/home-records/:id/entries — add a log entry to a register */
exports.addRecordEntry = async (req, res) => {
  try {
    const { content, childId, childName, referenceNo, attachmentUrl } = req.body;
    if (!content) return res.status(400).json({ message: 'content is required' });
    const record = await HomeRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    record.entries.push({
      content, childId, childName, referenceNo, attachmentUrl,
      enteredBy: req.user.auth_id,
      date: new Date(),
    });
    await record.save();
    await log(req, 'ADD_RECORD_ENTRY', 'home_record', record._id, record.title, null, { content });
    res.status(201).json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** DELETE /admin/home-records/:id/entries/:entryId */
exports.deleteRecordEntry = async (req, res) => {
  try {
    const record = await HomeRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    const entry = record.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    entry.deleteOne();
    await record.save();
    res.json({ message: 'Entry deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** GET /admin/home-records/summary/:home
 *  Returns compliance overview: how many records exist vs expected,
 *  flagged/missing counts, and per-category status.
 */
exports.homeRecordSummary = async (req, res) => {
  try {
    const { home } = req.params;
    const records = await HomeRecord.find({ home }).lean();

    const REQUIRED_REGISTERS = 29; // shared registers per home
    const sharedCount  = records.filter(r => r.fileType === 'shared_register').length;
    const childCount   = records.filter(r => r.fileType === 'per_child').length;
    const missingCount = records.filter(r => r.status === 'missing').length;
    const flaggedCount = records.filter(r => r.status === 'flagged' || (r.entries || []).some(e => e.status === 'flagged')).length;

    // Group by category for detailed view
    const byCategory = {};
    for (const r of records) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push({ _id: r._id, title: r.title, fileType: r.fileType, status: r.status, childName: r.childName });
    }

    res.json({
      home,
      sharedRegisters: { present: sharedCount, required: REQUIRED_REGISTERS },
      perChildFiles:   { total: childCount },
      missingCount,
      flaggedCount,
      byCategory,
      complianceScore: Math.round((Math.min(sharedCount, REQUIRED_REGISTERS) / REQUIRED_REGISTERS) * 100),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
