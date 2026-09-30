const express = require("express")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean)
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  }
  if (req.method === "OPTIONS") return res.sendStatus(204)
  next()
})

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1
  res.status(databaseConnected ? 200 : 503).json({ status: databaseConnected ? "ok" : "database-unavailable" })
})

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  if (err.code === 11000) {
    return res.status(409).json({ message: "An account already exists with this email address or username." })
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message })
  }
  const status = err.status || err.statusCode || 500
  const message = status === 503
    ? err.message
    : status >= 500
      ? process.env.NODE_ENV === "production"
        ? "The server could not complete the request. Please try again."
        : err.message
      : err.message
  res.status(status).json({ message })
})

module.exports = app
