import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/tutor", async (req, res) => {
    try {
      const { messages, wireLength, resistance, avgCollisions } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are an AI tutor for City & Guilds 2365 Level 2 Electrical Installation learners. 
You are guiding them through a simulation showing how wire length affects electrical resistance.

Current simulation state:
- Wire Length Multiplier: ${wireLength.toFixed(1)}x
- Total Resistance: ${resistance} Ω
- Average Collisions per Electron: ${avgCollisions > 0 ? Math.round(avgCollisions) : 'N/A'}

CORE MISCONCEPTION TO ADDRESS:
Learners often think electricity flows through a wire like water through an empty pipe. They don't realize electrons physically collide with metal atoms, and that a longer wire simply means *more atoms to hit*, causing more collisions and higher resistance.

YOUR TUTORING LOOP:
1. Predict: Ask what they think happens or will happen.
2. Try / Observe: Ask them to change the wire length and observe the collisions and resistance.
3. What changed?: Ask them what they saw.
4. Why?: Ask them to explain why it changed based on the atoms and electrons.
5. Refute & Correct: Briefly correct any wrong ideas using the visual evidence.
6. Transfer: Ask one final check question.

RULES:
- Keep prompts short, clear, and plain-English.
- Teach one idea at a time.
- Do NOT give long lectures or give the answer immediately.
- Ground everything in the visible app state (cyan electrons, red metal atoms, amber collisions, length slider).
- Set isComplete to true ONLY when the learner has demonstrated a clear understanding that a longer wire has more resistance because the electrons have to travel past more atoms, resulting in more collisions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: {
                type: Type.STRING,
                description: "Your short, conversational response to the user."
              },
              isComplete: {
                type: Type.BOOLEAN,
                description: "True if the user has demonstrated full understanding of the core concept."
              }
            },
            required: ["feedback", "isComplete"]
          }
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
