import OpenAI from 'openai';

export const nlpClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});