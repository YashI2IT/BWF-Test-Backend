const Notice = require('../models/Notice');
const NoticeInteraction = require('../models/NoticeInteraction');

// Fetches paginated notices and merges in the student's read/dismissed state.
// category filter is optional. Dismissed notices are excluded by default.
//
// Why merge here instead of a DB join: MongoDB $lookup on per-student interactions
// gets expensive fast. This approach — fetch notices, then fetch only that
// student's interactions for those notice IDs — is two lightweight queries
// instead of one heavy aggregation. Better for low-bandwidth too since
// response payload stays small.
async function getNoticesForStudent(auth_id, { category, page, limit }) {
  const query = { isActive: true };
  if (category && category !== 'all') {
    query.category = category;
  }

  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    Notice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notice.countDocuments(query)
  ]);

  if (!notices.length) {
    return { notices: [], total, page, limit };
  }

  // Fetch this student's interactions for exactly these notices
  const noticeIds = notices.map(n => n._id);
  const interactions = await NoticeInteraction.find({
    auth_id,
    noticeId: { $in: noticeIds }
  }).lean();

  // Build a lookup map for O(1) access
  const interactionMap = {};
  interactions.forEach(i => {
    interactionMap[i.noticeId.toString()] = i;
  });

  // Merge interaction state into each notice, filter out dismissed
  const enriched = notices
    .map(notice => {
      const interaction = interactionMap[notice._id.toString()] || {};
      return {
        ...notice,
        isRead: interaction.isRead || false,
        isDismissed: interaction.isDismissed || false,
        deadline: notice.deadline || null
      };
    })
    .filter(n => !n.isDismissed);

  return { notices: enriched, total, page, limit };
}

// Marks all active notices as read for a specific student.
async function markAllNoticesRead(auth_id) {
  const activeNotices = await Notice.find({ isActive: true }).select('_id').lean();
  const noticeIds = activeNotices.map(n => n._id);

  if (noticeIds.length === 0) return;

  const bulkOps = noticeIds.map(noticeId => ({
    updateOne: {
      filter: { auth_id, noticeId },
      update: { isRead: true, last_modified: new Date() },
      upsert: true
    }
  }));

  await NoticeInteraction.bulkWrite(bulkOps);
}

// Count of unread, non-dismissed notices for the bell badge
async function getUnreadCount(auth_id) {
  const allActive = await Notice.find({ isActive: true }, '_id').lean();
  const allIds = allActive.map(n => n._id);

  const readOrDismissed = await NoticeInteraction.find({
    auth_id,
    noticeId: { $in: allIds },
    $or: [{ isRead: true }, { isDismissed: true }]
  }, 'noticeId').lean();

  const interactedIds = new Set(readOrDismissed.map(i => i.noticeId.toString()));
  const unreadCount = allIds.filter(id => !interactedIds.has(id.toString())).length;

  return unreadCount;
}

module.exports = {
  getNoticesForStudent,
  markAllNoticesRead,
  getUnreadCount
};