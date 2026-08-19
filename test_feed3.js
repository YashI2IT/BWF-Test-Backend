const mongoose = require('mongoose');
require('dotenv').config();
const adminController = require('./admin/controller');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const req = { query: {}, user: { id: "dummy_id" } };
    const res = {
      status: function(code) { return this; },
      json: function(data) { 
        console.log("Admin total posts:", data.length); 
        console.log(data.map(p => ({ role: p.creatorRole, cat: p.tags && p.tags[0], id: p._id.toString() })));
      }
    };
    await adminController.listLivePosts(req, res);
  } catch (e) {
    console.error(e);
  }
  mongoose.disconnect();
});
