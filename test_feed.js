const mongoose = require('mongoose');
require('dotenv').config();
const { getUnifiedCommunityPosts } = require('./utils/communityFeed');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const posts = await getUnifiedCommunityPosts("dummy_id");
    console.log("Total posts:", posts.length);
    console.log(posts.map(p => ({ role: p.creatorRole || p.role, cat: p.category, id: p._id.toString() })));
  } catch (e) {
    console.error(e);
  }
  mongoose.disconnect();
});
