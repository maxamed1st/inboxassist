import OpenAI from 'openai';

export const nlpClient = new OpenAI({
  baseURL: "https://api.anthropic.com/v1/",
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-version": "2023-06-01"
  }
});
