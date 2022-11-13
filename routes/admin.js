const express = require("express");
const router = express.Router();
const verify = require("./adminverifyToken");

const adminController = require("../controller/admin");
// router.get('/adminStudentRequests', adminController.adminStudentRequests);
router.post("/login", adminController.login);
router.get("/logout", adminController.logout);
router.get("/attendance", verify, adminController.attendance);
router.get("/attendance/:course", verify, adminController.studentList);
router.get("/complaint/get", verify, adminController.complaints);
router.get("/studentRequests/get", verify, adminController.studentRequest);
router.get("/home", verify, adminController.adminDashboard);

router.post(
  "/attendance/update",
  verify,
  adminController.updateStudentAttendance
);
router.post("/complaint/status", verify, adminController.changeComplaintStatus);
router.post(
  "/studentRequest/status",
  adminController.changeStudentRequestStatus
);
router.post("/delete", verify, adminController.deleteDatabase);
// router.get("/timetable", adminController.timetable);

router.post("/add-student", adminController.addStudent);
router.post("/addAlumni", adminController.addAlumni);
router.post("/addCourse", adminController.addCourse);
router.post("/addOpportunity", adminController.addOpportunity);
router.get("/login", adminController.getLogin);

module.exports = router;
