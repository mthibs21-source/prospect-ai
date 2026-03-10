import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post("/api/generate-email", async (req, res) => {

  const { contact, company, pitch, news } = req.body

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SDR copywriter."
        },
        {
          role: "user",
          content: `
Write a short cold email.

Prospect: ${contact}
Company: ${company}
News: ${news}
Pitch: ${pitch}

3 sentences.
Conversational.
No hype.
`
        }
      ]
    })

    res.json({
      email: completion.choices[0].message.content
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      error: "Email generation failed"
    })

  }

})

app.listen(5000, () => {
  console.log("AI Prospect API running on port 5000")
})