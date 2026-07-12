const NoticeInteraction = require('../models/NoticeInteraction');
const { getNoticesForStudent, getUnreadCount, markAllNoticesRead } = require('./service');

async function getNotices(req, res) {
  const auth_id = req.user.auth_id;

  const { category = 'all', page = 1, limit = 20 } = req.query;

  try {
    const data = await getNoticesForStudent(auth_id, { 
      category, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    return res.status(200).json(data);
  } catch (err) {
    console.error('GET NOTICES ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function markRead(req, res) {
  const { noticeId } = req.params;
  const auth_id = req.user.auth_id;

  try {
    await NoticeInteraction.findOneAndUpdate(
      { auth_id, noticeId },
      { isRead: true, last_modified: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json({ message: 'Notice marked as read' });
  } catch (err) {
    console.error('MARK READ ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function markAllRead(req, res) {
  const auth_id = req.user.auth_id;
  
  try {
    await markAllNoticesRead(auth_id);
    return res.status(200).json({ message: 'All notices marked as read' });
  } catch (err) {
    console.error('MARK ALL READ ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function dismissNotice(req, res) {
  const { noticeId } = req.params;
  const auth_id = req.user.auth_id;

  try {
    await NoticeInteraction.findOneAndUpdate(
      { auth_id, noticeId },
      { isDismissed: true, last_modified: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json({ message: 'Notice dismissed' });
  } catch (err) {
    console.error('DISMISS ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getUnreadBadge(req, res) {
  const auth_id = req.user.auth_id;
  try {
    const count = await getUnreadCount(auth_id);
    return res.status(200).json({ unreadCount: count });
  } catch (err) {
    console.error('UNREAD BADGE ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getNotices,
  markRead,
  markAllRead,
  dismissNotice,
  getUnreadBadge
};
