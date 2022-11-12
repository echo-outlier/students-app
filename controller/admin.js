const User = require("../models/users");
const Alumni = require("../models/alumni");
const Course = require("../models/course");
const Attendance = require("../models/attendance");
const Opportunity = require("../models/opportunity");
const StudentRequest = require("../models/studentRequests");
const Complaint = require("../models/complaints");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.adminDashboard = async (req, res) => {
  res.render("adminDashboard");
};

exports.attendance = async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });
  console.log("user", user.courses);
  res.render("adminAttendance", {
    courses: user.courses,
  });
};

exports.studentList = async (req, res) => {
  const courseName = req.params.course;
  const allUsers = await User.find();
  const courseDetails = await Course.find({ courseName: courseName });
  const totalClasses = courseDetails[0].totalClasses;
  const studentList = [];
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].email != "admin@gmail.com") {
      const attendance = await Attendance.find({
        email: allUsers[i].email,
        courseName: courseName,
      });
      const absentClasses = attendance[0].classesAbsent;
      console.log("attendance", attendance);
      studentList.push({
        email: allUsers[i].email,
        name: allUsers[i].name,
        rollno: allUsers[i].rollno,
        classesAbsent: absentClasses,
        classesPresent: totalClasses - absentClasses,
        totalClasses: totalClasses,
      });
    }
  }

  res.render("studentList", {
    courseName: courseName,
    totalClasses: courseDetails.totalClasses,
    studentList: studentList,
  });
};

exports.complaints = async (req, res) => {
  let { query, status } = req.query;
  console.log("query", query);
  console.log("await", await Complaint.find({}));

  const user = await User.findOne({ email: req.user.email });
  let result;
  if (query == undefined) {
    result = await Complaint.find({}, null, { sort: { createdAt: -1 } });
  }
  if (query === "progress") {
    result = await Complaint.find(
      {
        status: "INPROGRESS",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "resolved") {
    result = await Complaint.find(
      {
        status: "RESOLVED",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }

  const color = [
    "#666ee8",
    "#28d094",
    "#1e9ff2",
    "#ff9149",
    "#ff4961",
    "#2196f3",
  ];
  const modifiedResult = result
    ? result.map((e, index) => {
        e["color"] = color[index % 6];
        return e;
      })
    : [];
  res.render("adminComplaints", {
    all: modifiedResult,
    name: user.name,
    query,
  });
};

exports.changeComplaintStatus = async (req, res) => {
  const { id, status } = req.body;
  console.log("status", id, status);
  const ss = await Complaint.find({ _id: id });
  console.log("ss", ss);
  const sq = await Complaint.updateOne({ _id: id }, { status: status });
  console.log("sq", sq);
  res.status(200).send({ data: sq });
};

exports.changeStudentRequestStatus = async (req, res) => {
  const { id, status } = req.body;
  console.log("status", id, status);
  const ss = await StudentRequest.find({ _id: id });
  console.log("ss", ss);
  const sq = await StudentRequest.updateOne({ _id: id }, { status: status });
  console.log("sq", sq);
  res.status(200).send({ data: sq });
};

exports.studentRequest = async (req, res) => {
  let { query } = req.query;

  console.log("query", query);
  const user = await User.findOne({ email: req.user.email });
  let result;
  if (query == undefined) {
    result = await StudentRequest.find({}, null, { sort: { createdAt: -1 } });
  }
  if (query === "progress") {
    result = await StudentRequest.find(
      {
        status: "INPROGRESS",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "RESOLVED") {
    result = await StudentRequest.find(
      {
        status: "RESOLVED",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  const color = [
    "#666ee8",
    "#28d094",
    "#1e9ff2",
    "#ff9149",
    "#ff4961",
    "#2196f3",
  ];
  const modifiedResult = result.map((e, index) => {
    e["color"] = color[index % 6];
    return e;
  });

  console.log(modifiedResult);
  res.render("adminStudentRequests", {
    all: modifiedResult,
    name: user.name,
    query,
  });
};

exports.login = async (req, res) => {
  console.log("req", req.body);
  if (req.body.email != "admin@gmail.com") {
    return res.render("adminlogin", { alert: "not" });
  }

  // const all = await User.find();
  // console.log("all", all);
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.render("adminlogin", { alert: "email" });

  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.render("adminlogin", { alert: "password" });

  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.TOKEN_SECRET
  );

  req.session.authtoken = token;
  res.redirect("/admin/home");
};

exports.logout = async () => {
  req.session.destroy((err) => {
    res.redirect("/admin/login");
  });
};

exports.addStudent = async (req, res, next) => {
  const {
    name,
    lastName,
    email,
    password,
    gender,
    phoneNumber,
    batch,
    branch,
    semester,
    courses,
  } = req.body;

  const emailExist = await User.findOne({ email });
  if (emailExist) return res.status(400).send("Email already exists");

  // Hash Passwords
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    const result = await User.create({
      name,
      lastName,
      email,
      password: hashPassword,
      gender,
      phoneNumber,
      batch,
      branch,
      semester,
      courses,
    });
    courses.map(async (e) => {
      await Attendance.create({
        email: email,
        courseName: e,
        classesAbsent: 0,
      });
    });
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.addAlumni = async (req, res, next) => {
  const { fullName, email, linkedln, role, image } = req.body;

  const emailExist = await Alumni.findOne({ email });
  if (emailExist)
    return res.status(400).send("Alumni with this email already exists");

  try {
    const result = await Alumni.create({
      fullName,
      email,
      linkedln,
      role,
      image,
    });
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.addCourse = async (req, res, next) => {
  const { courseName, totalStudents, totalClasses } = req.body;

  const courseExist = await Course.findOne({ courseName });
  if (courseExist) return res.status(400).send("Course already exists");

  try {
    const result = await Course.create({
      courseName,
      totalStudents,
      totalClasses,
    });
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.addOpportunity = async (req, res, next) => {
  try {
    const result = await Opportunity.create(req.body);
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getLogin = (req, res) => {
  res.render("adminlogin", { alert: "" });
};
