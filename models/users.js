const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  batch: {
    type: Number,
    required: false,
  },
  semester: {
    type: Number,
    required: false,
  },
  branch: {
    type: String,
    required: false,
  },
  courses: {
    type: Array,
  },
});

module.exports = mongoose.model("User", userSchema);
