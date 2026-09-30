const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")

function getAi() {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw Object.assign(new Error("AI service is not configured. Set GOOGLE_GENAI_API_KEY in Backend/.env."), { status: 503 })
  }
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
}

async function generateJson({ contents, responseSchema }) {
  const ai = getAi()
  const primaryModel = process.env.GOOGLE_GENAI_MODEL || "gemini-3.8-flash"
  const fallbackModel = process.env.GOOGLE_GENAI_FALLBACK_MODEL || "gemini-3.5-flash-lite"
  const models = [...new Set([primaryModel, fallbackModel])]
  let lastError

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await ai.models.generateContent({
          model: models[modelIndex],
          contents,
          config: { responseMimeType: "application/json", responseSchema },
        })
      } catch (error) {
        lastError = error
        const retryable = [408, 429, 500, 502, 503, 504].includes(Number(error.status))
        if (!retryable) throw error
        if (attempt === 0) {
          const delay = 500 * (2 ** modelIndex) + Math.floor(Math.random() * 250)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
  }

  throw Object.assign(
    new Error("The AI service is temporarily busy. Please try again in a minute."),
    { status: 503, cause: lastError },
  )
}

const reportSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    matchScore: { type: "INTEGER" },
    technicalQuestions: { type: "ARRAY", items: { type: "OBJECT", properties: { question: { type: "STRING" }, intention: { type: "STRING" }, answer: { type: "STRING" } }, required: ["question", "intention", "answer"] } },
    behavioralQuestions: { type: "ARRAY", items: { type: "OBJECT", properties: { question: { type: "STRING" }, intention: { type: "STRING" }, answer: { type: "STRING" } }, required: ["question", "intention", "answer"] } },
    skillGaps: { type: "ARRAY", items: { type: "OBJECT", properties: { skill: { type: "STRING" }, severity: { type: "STRING", enum: ["low", "medium", "high"] } }, required: ["skill", "severity"] } },
    preparationPlan: { type: "ARRAY", items: { type: "OBJECT", properties: { day: { type: "INTEGER" }, focus: { type: "STRING" }, tasks: { type: "ARRAY", items: { type: "STRING" } } }, required: ["day", "focus", "tasks"] } },
  },
  required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"],
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  const response = await generateJson({
    contents: `Create a practical interview preparation report using the candidate information and job description below. Do not invent candidate experience. Return concise but useful answers.\n\nResume:\n${resume || "Not provided"}\n\nCandidate description:\n${selfDescription || "Not provided"}\n\nJob description:\n${jobDescription}`,
    responseSchema: reportSchema,
  })
  return JSON.parse(response.text)
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const response = await generateJson({
    contents: `Create a truthful, ATS-friendly resume tailored to this job. Use only facts in the candidate material; do not invent qualifications. Return JSON with one field html containing a complete, professional HTML document.\nCandidate resume: ${resume || "Not provided"}\nCandidate description: ${selfDescription || "Not provided"}\nJob description: ${jobDescription}`,
    responseSchema: { type: "OBJECT", properties: { html: { type: "STRING" } }, required: ["html"] },
  })
  const { html } = JSON.parse(response.text)
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 })
    return await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "15mm", right: "15mm" } })
  } finally {
    await browser.close()
  }
}

module.exports = { generateInterviewReport, generateResumePdf }
