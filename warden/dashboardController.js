const mongoose = require('mongoose');
const Student = require('../student/models/student');
const Staff = require('./models/staff');
const Activity = require('./models/activity');
const Complaint = require('./models/complaints');
const Expense = require('../models/Expense');
const Notice = require('../student/models/Notice');

async function getDashboardStats(req, res) {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Quick Stats
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const activeEvents = await Activity.countDocuments({ status: 'Approved', date: { $gte: today } });
    const pendingComplaints = await Complaint.countDocuments({ status: 'OPEN' });
    
    // Expenses this month
    const expensesThisMonth = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyExpenses = expensesThisMonth.length > 0 ? expensesThisMonth[0].total : 0;

    // Calendar Events (Upcoming)
    const upcomingActivities = await Activity.find({ status: 'Approved', date: { $gte: today } })
      .sort({ date: 1 })
      .limit(5);
      
    const calendarEvents = upcomingActivities.map(act => {
      // Map to frontend expected format
      let type = 'activity';
      if (act.category === 'Academic') type = 'meeting';
      
      return {
        date: new Date(act.date).getDate(),
        title: act.title,
        time: act.time,
        type: type
      };
    });

    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Expense Trend Data (Last 6 months)
    const trendData = [];
    const expenseAgg = await Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $group: { 
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" } 
      }}
    ]);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // MongoDB $month is 1-indexed

      const record = expenseAgg.find(e => e._id.year === year && e._id.month === month);
      
      trendData.push({
        month: monthStr,
        amount: record ? record.total : 0,
        budget: 50000 // static budget for now
      });
    }

    // Expense Breakdown (This month)
    const breakdown = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } }
    ]);
    
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
    const expenseBreakdown = breakdown.map((item, index) => ({
      name: item._id,
      value: item.value,
      fill: colors[index % colors.length]
    }));

    // Complaint Data (Last 6 months)
    const complaintTrend = [];
    const complaintAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { 
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, status: "$status" },
          count: { $sum: 1 } 
      }}
    ]);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      const resolvedRec = complaintAgg.find(c => c._id.year === year && c._id.month === month && c._id.status === 'RESOLVED');
      const pendingRec = complaintAgg.find(c => c._id.year === year && c._id.month === month && c._id.status === 'OPEN');
      
      complaintTrend.push({
        month: monthStr,
        resolved: resolvedRec ? resolvedRec.count : 0,
        pending: pendingRec ? pendingRec.count : 0
      });
    }

    // Inbox Messages
    const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5);
    const recentActivities = await Activity.find().sort({ createdAt: -1 }).limit(5);
    const recentNotices = await Notice.find().sort({ createdAt: -1 }).limit(5);
    
    const inboxMessages = [];
    
    recentComplaints.forEach(c => {
      inboxMessages.push({
        id: 'comp_' + c._id,
        sender: c.reporter,
        subject: c.title,
        preview: c.description,
        time: new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: new Date(c.createdAt).getTime(),
        isRead: false,
        isPinned: c.priority === 'High',
        type: 'complaint'
      });
    });
    
    recentActivities.forEach(a => {
      inboxMessages.push({
        id: 'act_' + a._id,
        sender: a.requestedBy,
        subject: a.title,
        preview: a.description || 'Activity request.',
        time: new Date(a.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: new Date(a.createdAt).getTime(),
        isRead: false,
        isPinned: false,
        type: 'activity'
      });
    });
    
    recentNotices.forEach(n => {
      inboxMessages.push({
        id: 'not_' + n._id,
        sender: n.authorName || 'System',
        subject: n.title,
        preview: n.body,
        time: new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: new Date(n.createdAt).getTime(),
        isRead: false,
        isPinned: true, // pin notices by default
        type: 'admin'
      });
    });
    
    // Sort all combined messages by timestamp descending
    inboxMessages.sort((a, b) => b.timestamp - a.timestamp);
    const finalInbox = inboxMessages.slice(0, 6);

    return res.status(200).json({
      quickStats: {
        totalStudents,
        totalStaff,
        activeEvents,
        pendingComplaints,
        monthlyExpenses
      },
      expenseTrendData: trendData,
      expenseBreakdown: expenseBreakdown,
      complaintData: complaintTrend,
      calendarEvents: calendarEvents,
      inboxMessages: finalInbox
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = {
  getDashboardStats
};
