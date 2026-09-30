const multer = require("multer")

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const accepted = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!accepted.includes(file.mimetype)) return callback(Object.assign(new Error("Upload a PDF or DOCX resume"), { status: 400 }))
    callback(null, true)
  },
})

module.exports = upload
