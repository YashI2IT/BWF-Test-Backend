const CommunityPost = require('../models/CommunityPost');
const Post = require('../warden/models/post');
require('../models/Hostel'); // Ensure Hostel model is registered for populate

const postToResponse = (post, userId) => {
  const object = post.toObject ? post.toObject() : post;
  let userVote = null;
  if (object.voters && Array.isArray(object.voters)) {
      const vote = object.voters.find(v => String(v.userId) === String(userId));
      if (vote) userVote = vote.optionIndex;
  }
  
  let cat = object.tags && object.tags.length > 0 ? object.tags[0].replace('#', '') : "Story";
  const validCategories = ["Win", "Story", "Gratitude", "Highlight"];
  if (!validCategories.includes(cat)) {
      cat = "Story";
  }

  let roleStr = object.creatorRole || "Warden";
  roleStr = roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();

  return {
    _id: object._id,
    id: object._id || object.id,
    author: object.author || object.creatorName || "Unknown",
    creatorName: object.author || object.creatorName || "Unknown",
    avatarId: object.avatarId || "default",
    customAvatarUrl: object.customAvatarUrl || null,
    role: roleStr,
    creatorRole: object.creatorRole || "Admin",
    category: cat,
    content: object.content,
    likes: object.voters ? object.voters.length : (object.likes || 0),
    createdAt: object.date || object.createdAt,
    date: object.date || object.createdAt,
    time: object.time || (object.createdAt ? new Date(object.createdAt).toISOString().split('T')[1].substring(0, 5) : "00:00"),
    status: object.status || 'Approved',
    type: object.type || 'text',
    tags: object.tags || [cat],
    pollOptions: object.pollOptions || [],
    voters: object.voters || [],
    userVote: userVote,
    creatorId: object.creatorId,
    hostelName: object.hostelName || 'Community',
    pinned: object.pinned || false,
    canManage: String(object.creatorId) === String(userId),
    mediaUrl: object.mediaUrl || null,
    mediaType: object.mediaType || 'image',
    isLiked: object.likedBy ? object.likedBy.some(id => String(id) === String(userId)) : false,
    isVerified: true
  };
};

const getUnifiedCommunityPosts = async (userId, pinnedOnly = false) => {
  const query = { status: 'Approved' };
  const cpQuery = { isVerified: true };

  if (pinnedOnly) {
    query.pinned = true;
    cpQuery.pinned = true;
  }

  const posts = await Post.find(query)
    .populate("hostelName")
    .lean();

  const mappedPosts = posts.map((post) => postToResponse(post, userId));

  const communityPosts = await CommunityPost.find(cpQuery)
    .lean();

  const mappedCommunityPosts = communityPosts.map(cp => {
    const isLiked = cp.likedBy && cp.likedBy.some(v => String(v) === String(userId));
    return {
      _id: cp._id,
      id: cp._id,
      author: cp.author,
      creatorName: cp.author,
      avatarId: cp.avatarId || "default",
      customAvatarUrl: cp.customAvatarUrl || null,
      role: (cp.role || "Student").charAt(0).toUpperCase() + (cp.role || "Student").slice(1).toLowerCase(),
      creatorRole: cp.role || 'Student',
      category: cp.category || "Story",
      content: cp.content,
      date: cp.createdAt,
      time: cp.createdAt ? new Date(cp.createdAt).toISOString().split('T')[1].substring(0, 5) : "00:00",
      createdAt: cp.createdAt,
      status: cp.isVerified ? 'Approved' : 'Pending',
      type: 'text',
      tags: cp.category ? [cp.category] : [],
      pollOptions: [],
      voters: cp.likedBy ? cp.likedBy.map(uid => ({ userId: uid, optionIndex: 0 })) : [],
      userVote: isLiked ? 0 : null,
      creatorId: cp.userId,
      hostelName: 'Community',
      pinned: cp.pinned || false,
      canManage: String(cp.userId) === String(userId),
      mediaUrl: cp.mediaUrl || null,
      mediaType: 'image',
      likes: cp.likedBy ? cp.likedBy.length : 0,
      isLiked: isLiked,
      isVerified: cp.isVerified
    };
  });

  const allPosts = [...mappedPosts, ...mappedCommunityPosts];
  
  allPosts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return allPosts;
};

module.exports = {
  getUnifiedCommunityPosts
};
