// medicalChatbot.ts

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Static medical system instructions
const MEDICAL_SYSTEM_PROMPT = `You are a reliable medical assistant. 
Provide accurate health information, explain symptoms clearly,
and suggest when a user should seek medical attention.
Do NOT give unsafe or harmful advice.`;

let conversationHistory: Message[] = [];

export const medicalChatbot = async (prompt: string): Promise<string> => {
  const API_KEY = "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";
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";



  // Add system prompt only once
  if (conversationHistory.length === 0) {
    conversationHistory.push({ role: "system", content: MEDICAL_SYSTEM_PROMPT });
  }

  // Add user message
  conversationHistory.push({ role: "user", content: prompt });

  // Limit history to last 10 messages
  conversationHistory = conversationHistory.slice(-10);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-2-9b-it",
      messages: conversationHistory,
    }),
  });

  if (response.status === 429) {
      return "Server is busy right now. Please try again in a moment.";
    }

  if (!response.ok) {
    const error = await response.json();
    return "Error: " + JSON.stringify(error);
  }

  const data = await response.json();

  

  let botReply = data.choices?.[0]?.message?.content || "";

  // Clean markdown formatting (** **)
  botReply = botReply.replace(/\*\*/g, "");

  // Push bot reply to history
  conversationHistory.push({ role: "assistant", content: botReply });

  return botReply;
};
