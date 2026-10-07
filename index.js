const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("ERROR: Falta GEMINI_API_KEY en las variables de entorno.");
}

const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey
    })
  : null;

app.use(express.json({ limit: "1mb" }));

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});


app.post("/api/chat", async (req, res) => {
  try {

    if (!ai) {
      return res.status(500).json({
        error:
          "La API de Gemini no está configurada en Render."
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Los mensajes no tienen un formato válido."
      });
    }

    const cleanMessages = messages
      .filter(message =>
        message &&
        (
          message.role === "user" ||
          message.role === "assistant"
        ) &&
        typeof message.content === "string"
      )
      .slice(-30);

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        error: "No hay mensajes para enviar."
      });
    }


    const contents = cleanMessages.map(message => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: message.content
        }
      ]
    }));


    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: contents,

      config: {
        systemInstruction:
          "Eres un asistente de IA útil, claro y amigable. " +
          "Responde en el mismo idioma que utiliza el usuario. " +
          "No inventes información cuando no estés seguro.",

        temperature: 0.7,

        maxOutputTokens: 2000
      }
    });


    const answer =
      response.text ||
      "No pude generar una respuesta.";


    res.json({
      response: answer
    });

  } catch (error) {

    console.error(
      "Error de Gemini:",
      error
    );

    res.status(500).json({
      error:
        "Gemini no pudo responder. Revisa la API key y los límites de tu cuenta."
    });
  }
});


app.listen(PORT, () => {
  console.log(
    `AI Chat funcionando en el puerto ${PORT}`
  );
});
