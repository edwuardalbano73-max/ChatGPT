const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Formato de mensajes inválido."
      });
    }

    const cleanMessages = messages
      .filter(
        message =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .slice(-30);

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        error: "No hay mensajes."
      });
    }

    const response = await client.responses.create({
      model: "gpt-6-luna",
      instructions:
        "Eres un asistente útil, claro y amigable. Responde en el mismo idioma que utiliza el usuario. No inventes información cuando no estés seguro.",
      input: cleanMessages
    });

    res.json({
      response: response.output_text || "No pude generar una respuesta."
    });

  } catch (error) {
    console.error("Error de OpenAI:", error);

    res.status(500).json({
      error: "No se pudo obtener una respuesta de la IA."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Chat funcionando en el puerto ${PORT}`);
});
