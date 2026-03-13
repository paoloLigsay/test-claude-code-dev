import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getModel(modelName = "gemini-2.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}
