const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const controller = require("../controllers/interview.controller")

const router = Router()
router.post("/", authMiddleware.authUser, upload.single("resume"), controller.generateInterviewReport)
router.get("/", authMiddleware.authUser, controller.getAllInterviewReports)
router.get("/report/:interviewId", authMiddleware.authUser, controller.getInterviewReportById)
router.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, controller.generateResumePdf)

module.exports = router
