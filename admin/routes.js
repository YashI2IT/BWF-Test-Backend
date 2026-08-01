// admin/routes.js
// All admin API endpoints. Protected by JWT auth + admin role check.

const express    = require('express');
const router     = express.Router();
const ctrl       = require('./controller');
const { authenticateToken } = require('../auth/middleware');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

router.use(authenticateToken, requireAdmin);

// Overview
router.get('/overview', ctrl.getOverview);

// Students
router.get   ('/students',     ctrl.listStudents);
router.post  ('/students',     ctrl.addStudent);
router.put   ('/students/:id', ctrl.updateStudent);
router.delete('/students/:id', ctrl.deactivateStudent);

// Staff
router.get   ('/staff',     ctrl.listStaff);
router.post  ('/staff',     ctrl.addStaff);
router.put   ('/staff/:id', ctrl.updateStaff);
router.delete('/staff/:id', ctrl.deactivateStaff);

// Expenses
router.get   ('/expenses',     ctrl.listExpenses);
router.post  ('/expenses',     ctrl.addExpense);
router.put   ('/expenses/:id', ctrl.updateExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);

// Finance KPIs
router.get ('/finance/kpis', ctrl.getFinanceKPIs);
router.post('/finance/kpis', ctrl.upsertFinanceKPI);

// Posts (social media / community)
router.get   ('/posts',     ctrl.listPosts);
router.post  ('/posts',     ctrl.addPost);
router.put   ('/posts/:id', ctrl.reviewPost);
router.delete('/posts/:id', ctrl.deletePost);

// Audit Logs (read-only)
router.get('/audit-logs', ctrl.getAuditLogs);

// Reports
router.get('/reports/summary', ctrl.getReportSummary);

// Feedback
router.get ('/feedback',         ctrl.listFeedback);
router.post('/feedback',         ctrl.addFeedback);
router.put ('/feedback/:id',     ctrl.reviewFeedback);

// Grievances
router.get ('/grievances',       ctrl.listGrievances);
router.post('/grievances',       ctrl.addGrievance);
router.put ('/grievances/:id',   ctrl.updateGrievance);

// Calendar
router.get   ('/calendar/events',     ctrl.getCalendarEvents);
router.post  ('/calendar/events',     ctrl.addCalendarEvent);
router.delete('/calendar/events/:id', ctrl.deleteCalendarEvent);

// Community — Pending Posts (moderation queue)
router.get   ('/community/pending',       ctrl.listPendingPosts);
router.put   ('/community/pending/:id',   ctrl.reviewPendingPost);
router.delete('/community/pending/:id',   ctrl.deletePendingPost);

// Community — Live Posts
router.get   ('/community/posts',         ctrl.listLivePosts);
router.post  ('/community/posts',         ctrl.createLivePost);
router.put   ('/community/posts/:id',     ctrl.updateLivePost);
router.delete('/community/posts/:id',     ctrl.deleteLivePost);
router.put   ('/community/posts/:id/pin', ctrl.togglePinPost);

// Activities — Pending
router.get   ('/activities/pending',     ctrl.listPendingActivities);
router.put   ('/activities/pending/:id', ctrl.reviewPendingActivity);
router.delete('/activities/pending/:id', ctrl.deletePendingActivity);

// Activities — Live
router.get   ('/activities',     ctrl.listActivities);
router.post  ('/activities',     ctrl.createActivity);
router.put   ('/activities/:id', ctrl.updateActivity);
router.delete('/activities/:id', ctrl.deleteActivity);

// Complaints
router.get   ('/complaints',            ctrl.listComplaints);
router.put   ('/complaints/:id/resolve', ctrl.resolveComplaint);
router.put   ('/complaints/:id/escalate',ctrl.escalateComplaint);
router.delete('/complaints/:id',        ctrl.deleteComplaint);

// ── Home Records (JJ Act Rule 21 & 22) ───────────────────────────────────────
router.get   ('/home-records',                    ctrl.listHomeRecords);
router.post  ('/home-records',                    ctrl.addHomeRecord);
router.put   ('/home-records/:id',                ctrl.updateHomeRecord);
router.delete('/home-records/:id',                ctrl.deleteHomeRecord);
router.post  ('/home-records/:id/entries',        ctrl.addRecordEntry);
router.delete('/home-records/:id/entries/:entryId', ctrl.deleteRecordEntry);
router.get   ('/home-records/summary/:home',      ctrl.homeRecordSummary);

module.exports = router;

