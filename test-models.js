import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_SUMOPOD_API_KEY,
  baseURL: process.env.VITE_SUMOPOD_BASE_URL,
});

async function main() {
  try {
    const list = await openai.models.list();
    console.log("Available Models:");
    list.data.forEach(model => console.log(`- ${model.id}`));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

main();
