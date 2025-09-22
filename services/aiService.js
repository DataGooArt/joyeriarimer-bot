// aiService.js
// 🧠 Google Gemini integration

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

/**
 * Genera una respuesta de texto simple usando Gemini
 * @param {string} prompt - El prompt a enviar al modelo
 * @returns {Promise<string>} La respuesta de texto del modelo
 */
async function generateAIResponse(prompt) {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Genera una respuesta estructurada en JSON a partir de un prompt.
 * @param {string} prompt - El prompt completo a enviar al modelo de lenguaje.
 * @returns {Promise<object>} El objeto JSON parseado de la respuesta del modelo.
 */
async function generateJsonResponse(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);
}

module.exports = { 
  generateAIResponse,
  generateJsonResponse 
};