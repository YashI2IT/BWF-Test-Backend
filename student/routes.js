const express = require("express");
const router = express.Router();

const profileRoutes = require("./profile/routes");
const wellbeingRoutes = require("./wellbeing/routes");
const communityRoutes = require("./community/routes");
const assignmentsRoutes = require("./assignments/routes");
const complaintsRoutes = require("./complaints/routes");
const dashboardRoutes = require("./dashboard/routes");
const noticeboardRoutes = require("./noticeboard/routes");
const sosRoutes = require("./sos/routes");

router.use("/profile", profileRoutes);
router.use("/wellbeing", wellbeingRoutes);
router.use("/community", communityRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/complaints", complaintsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/noticeboard", noticeboardRoutes);
router.use("/sos", sosRoutes);

module.exports = router;