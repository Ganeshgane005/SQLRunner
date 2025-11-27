const mongoose = require("mongoose");

const instanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference to User model
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  instanceUrl: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Instance = mongoose.model("Instance", instanceSchema);

module.exports = Instance;
