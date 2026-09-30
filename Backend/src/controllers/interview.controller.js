const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const mongoose = require("mongoose")
const InterviewReport = require("../models/interviewReport.model")
const { generateInterviewReport: generateWithAi, generateResumePdf: resumeToPdf } = require("../services/ai.service")

async function generateInterviewReport(req, res) {
  const { jobDescription = "", selfDescription = "" } = req.body
  if (!jobDescription.trim()) return res.status(400).json({ message: "Please provide a job description." })
  if (!req.file && !selfDescription.trim()) return res.status(400).json({ message: "Upload a resume or provide a self-description." })

  let resume = ""
  if (req.file) {
    if (req.file.mimetype === "application/pdf") {
      const parsed = pdfParse.PDFParse
        ? await new pdfParse.PDFParse(new Uint8Array(req.file.buffer)).getText()
        : await pdfParse(req.file.buffer)
      resume = parsed.text || ""
    } else {
      const parsed = await mammoth.extractRawText({ buffer: req.file.buffer })
      resume = parsed.value || ""
    }
    if (!resume.trim()) return res.status(400).json({ message: "No readable text found in the uploaded resume." })
  }

  const generated = await generateWithAi({ resume, selfDescription, jobDescription })
  const report = await InterviewReport.create({ ...generated, user: req.user.id, resume, selfDescription, jobDescription })
  return res.status(201).json({ message: "Interview report generated successfully.", interviewReport: report })
}

async function getInterviewReportById(req, res) {
  if (!mongoose.isValidObjectId(req.params.interviewId)) return res.status(404).json({ message: "Interview report not found." })
  const report = await InterviewReport.findOne({ _id: req.params.interviewId, user: req.user.id })
  if (!report) return res.status(404).json({ message: "Interview report not found." })
  return res.json({ message: "Interview report fetched successfully.", interviewReport: report })
}

async function getAllInterviewReports(req, res) {
  const reports = await InterviewReport.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -__v")
  return res.json({ message: "Interview reports fetched successfully.", interviewReports: reports })
}

async function generateResumePdf(req, res) {
  if (!mongoose.isValidObjectId(req.params.interviewReportId)) return res.status(404).json({ message: "Interview report not found." })
  const report = await InterviewReport.findOne({ _id: req.params.interviewReportId, user: req.user.id })
  if (!report) return res.status(404).json({ message: "Interview report not found." })
  const buffer = await resumeToPdf(report)
  res.type("application/pdf").set("Content-Disposition", `attachment; filename=resume_${report.id}.pdf`).send(buffer)
}

module.exports = { generateInterviewReport, getInterviewReportById, getAllInterviewReports, generateResumePdf }
