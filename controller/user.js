const User = require("../models/users");
const Course = require("../models/course");
const Attendance = require("../models/attendance");
const Opportunity = require("../models/opportunity");
const Alumni = require("../models/alumni");
const StudentRequest = require("../models/studentRequests");
const Complaint = require("../models/complaints");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.getLogin = async (req, res) => {
  // console.log(await User.find({}));
  res.render("login", { alert: "", admin: false });
};

exports.login = async (req, res, next) => {
  if (req.body.email == "admin@gmail.com") {
    return res.render("login", { alert: "admin" });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.render("login", { alert: "email" });

  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.render("login", { alert: "password" });

  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.TOKEN_SECRET
  );

  req.session.authtoken = token;
  res.redirect("/user/home");
};

exports.getSignup = (req, res) => {
  res.render("signup", { alert: "" });
};

exports.signup = async (req, res, next) => {
  try {
    const checkUser = await User.findOne({ email: req.body.email });
    if (checkUser) {
      res.render("signup", { alert: "exist" });
    }
    const { email, password, name, rollno } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const courses = ["AI", "ML", "CCN", "WAD", "TOC"];

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      courses,
      rollno,
    });

    for (let i = 0; i < user.courses.length; i++) {
      const attendence = await Attendance.create({
        email: email,
        courseName: user.courses[i],
        classesAbsent: 0,
      });
    }

    const token = jwt.sign(
      { user_id: user._id, email: user.email },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "2h",
      }
    );

    req.session.authtoken = token;
    res.redirect("/user/home");
  } catch (err) {
    console.log("err", err);
  }
};

exports.home = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.render("dashboard", { name: user.name });
};

exports.attendance = async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });
  console.log("user", user);
  const attendanceResult = await Promise.all(
    user.courses.map(async (e, index) => {
      console.log("e", e);
      const course = await Course.findOne({ courseName: e });
      console.log("course", course);
      const attendance = await Attendance.findOne({ email, courseName: e });
      const allColors = ["#23afe3", "#a7d212", "#ff4241", "#edc214"];
      return {
        courseName: e,
        Present: course.totalClasses - attendance.classesAbsent,
        Absent: attendance.classesAbsent,
        Total: course.totalClasses,
        Percent: Math.floor(
          ((course.totalClasses - attendance.classesAbsent) * 100) /
            course.totalClasses
        ),
        color: allColors[index % 4],
      };
    })
  );
  res.render("attendance", { name: user.name, info: attendanceResult });
};

exports.timetable = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.render("timetable", { name: user.name });
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("login");
  });
};

exports.library = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.render("library", { name: user.name });
};

exports.almanac = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.render("almanac", { name: user.name });
};

exports.alumninetwork = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const alumni = await Alumni.find();
  res.render("alumninetwork", { name: user.name, alumni });
};

exports.opportunity = async (req, res) => {
  const result = await Opportunity.find();
  const user = await User.findOne({ email: req.user.email });
  res.render("opportunity", { info: result, name: user.name });
};

exports.studentRequestsCreate = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const { title, description, tags } = req.body;
  const DATE = new Date();

  var monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const date =
    DATE.getDate() +
    " " +
    monthNames[DATE.getMonth()] +
    " " +
    DATE.getFullYear();
  const result = await StudentRequest.create({
    name: user.name,
    email: user.email,
    date,
    title,
    description,
    tags,
  });
  res.redirect("get");
};

exports.studentRequestsCreateGet = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  res.render("createSR", { name: user.name });
};

exports.studentRequestsGet = async (req, res) => {
  let { query } = req.query;

  const user = await User.findOne({ email: req.user.email });
  let result;
  if (query == undefined) {
    result = await StudentRequest.find(
      {
        email: user.email,
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "progress") {
    result = await StudentRequest.find(
      {
        email: user.email,
        status: "INPROGRESS",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "resolved") {
    result = await StudentRequest.find(
      {
        email: user.email,
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
  res.render("studentRequest", {
    all: modifiedResult,
    name: user.name,
    query,
  });
};

exports.complaintCreate = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const { title, description, tags } = req.body;
  const DATE = new Date();

  var monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const date =
    DATE.getDate() +
    " " +
    monthNames[DATE.getMonth()] +
    " " +
    DATE.getFullYear();

  const result = await Complaint.create({
    name: user.name,
    email: user.email,
    date,
    title,
    description,
    tags,
  });
  res.redirect("get");
};

exports.complaintCreateGet = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  res.render("createC", { name: user.name });
};

exports.complaintGet = async (req, res) => {
  let { query } = req.query;

  console.log("query", query);
  const user = await User.findOne({ email: req.user.email });
  let result;
  if (query == undefined) {
    result = await Complaint.find(
      {
        email: user.email,
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "progress") {
    result = await Complaint.find(
      {
        email: user.email,
        status: "INPROGRESS",
      },
      null,
      { sort: { createdAt: -1 } }
    );
  }
  if (query === "resolved") {
    result = await Complaint.find(
      {
        email: user.email,
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
    ? result?.map((e, index) => {
        e["color"] = color[index % 6];
        return e;
      })
    : [];
  res.render("complaint", { all: modifiedResult, name: user.name, query });
};

exports.studyMaterial = async (req, res) => {
  const user = await User.findOne({ email: req.user.email });

  res.render("studyMaterial", { name: user.name });
};
