const mongoose = require('mongoose');
require('dotenv').config();
const { getUnifiedCommunityPosts } = require('./utils/communityFeed');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const posts = await getUnifiedCommunityPosts("dummy_id");
    console.log("Unified feed first post:", JSON.stringify(posts[0], null, 2));

    const adminController = require('./admin/controller');
    const req = { query: {}, user: { id: "dummy_id" } };
    const res = {
      status: function(code) { return this; },
      json: function(data) { console.log("Admin post:", JSON.stringify(data[0], null, 2)); }
    };
    await adminController.listLivePosts(req, res);

  } catch (e) {
    console.error(e);
  }
  mongoose.disconnect();
});
