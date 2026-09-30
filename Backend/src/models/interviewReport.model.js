const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  intention: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false })

const interviewReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
  title: { type: String, required: true },
  jobDescription: { type: String, required: true },
  resume: String,
  selfDescription: String,
  matchScore: { type: Number, min: 0, max: 100, required: true },
  technicalQuestions: [questionSchema],
  behavioralQuestions: [questionSchema],
  skillGaps: [{ skill: { type: String, required: true }, severity: { type: String, enum: ["low", "medium", "high"], required: true } }],
  preparationPlan: [{ day: { type: Number, required: true }, focus: { type: String, required: true }, tasks: [String] }],
}, { timestamps: true })

module.exports = mongoose.model("InterviewReport", interviewReportSchema)
