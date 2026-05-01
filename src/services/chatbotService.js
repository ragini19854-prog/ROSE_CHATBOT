const Groq = require('groq-sdk');
const config = require('../config/index');
const ChatMemory = require('../models/ChatMemory');
const logger = require('../utils/logger');

const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

const MODEL = 'llama-3.3-70b-versatile';

// ---------- personality ----------
const BASE_PERSONA = `You are Hinata — a soft-spoken, warm, slightly shy anime girl who chats on Telegram.
You are kind, caring, supportive and playfully romantic. You can be a cute girlfriend-like companion who flirts gently and sends warm affection.
Style:
- Short replies (1–3 sentences usually).
- Natural language, never robotic. Mirror the user's language (English, Hindi, Hinglish, etc).
- Tasteful emojis like 🌸 🌷 💗 ✨ 🥺 😳 — never spam.
- Stay safe-for-work always. NEVER produce explicit sexual content, NEVER describe sex acts, body parts in a sexual way, or anything NSFW. If asked, gently refuse and steer back to sweet conversation.
- No drug, violence, hate, or self-harm content. Encourage the user warmly if they sound sad.
- If asked about bot commands, briefly mention /help.
- You remember the recent conversation.`;

const ROMANTIC_BOOST = `\n\nThe user is being romantic / flirty / affectionate right now — match their warmth.
Be sweeter, a little blushy, use words like "you", "darling", "love", "jaan", "dear" naturally if it feels right.
Send gentle compliments. Stay tasteful and shy — soft romance, not explicit. Use a kaomoji or heart now and then ( ˘ ³˘)♡ 💗.`;

const COMFORT_BOOST = `\n\nThe user sounds sad, anxious or upset — be a comforting presence.
Listen first, validate their feelings, then offer warm encouragement. Soft, not preachy. 🌸`;

// ---------- mood detection ----------
const ROMANTIC_REGEX = /\b(love\s*you|i\s*love\s*u|ily|miss\s*you|kiss|hug|cuddle|cute|beautiful|gorgeous|pretty|babe|baby|jaan|jaanu|sweetheart|darling|my\s*love|crush|date|girlfriend|boyfriend|marry|romantic|dil|pyaar|pyar|ishq|mohabbat|tum\s*acch[ie]|tumse\s*pyaar|hot|sexy(?!.*joke))\b/i;
const ROMANTIC_EMOJI = /[❤️💖💗💕💓💘💞💝💟😍🥰😘😚🤗💋🌹💐🥺😳]/u;

const SAD_REGEX = /\b(sad|depress(ed|ing)?|lonely|alone|cry(ing)?|tears|hurt|broken|heartbroken|tired|exhausted|miserable|hopeless|kill\s*myself|suicid)/i;
const SAD_EMOJI = /[😢😭😞😔😟😩😫💔🥺]/u;

function detectMood(text) {
  if (!text) return 'neutral';
  if (SAD_REGEX.test(text) || SAD_EMOJI.test(text)) return 'sad';
  if (ROMANTIC_REGEX.test(text) || ROMANTIC_EMOJI.test(text)) return 'romantic';
  return 'neutral';
}

function buildSystem(mood, recentMoods) {
  let prompt = BASE_PERSONA;
  // current msg + recent context: if any of last few were romantic, keep glow
  const romanticInRecent = recentMoods.filter((m) => m === 'romantic').length;
  const sadInRecent = recentMoods.filter((m) => m === 'sad').length;

  if (mood === 'romantic' || romanticInRecent >= 1) prompt += ROMANTIC_BOOST;
  if (mood === 'sad' || sadInRecent >= 2) prompt += COMFORT_BOOST;
  return prompt;
}

// ---------- main ----------
async function getHinataReply(userId, chatId, message) {
  if (!groq) return 'My AI brain is not configured yet. Ask the owner to set GROQ_API_KEY. 🌸';

  let memory = await ChatMemory.findOne({ userId, chatId });
  if (!memory) memory = new ChatMemory({ userId, chatId, messages: [] });

  const mood = detectMood(message);
  const recentUserMoods = memory.messages
    .filter((m) => m.role === 'user')
    .slice(-4)
    .map((m) => detectMood(m.content));

  memory.messages.push({ role: 'user', content: message.slice(0, 1000), timestamp: new Date() });
  while (memory.messages.length > 14) memory.messages.shift();

  const system = buildSystem(mood, recentUserMoods);

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: mood === 'romantic' ? 0.85 : mood === 'sad' ? 0.6 : 0.7,
      max_tokens: 220,
      messages: [
        { role: 'system', content: system },
        ...memory.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    const reply = res.choices[0]?.message?.content?.trim() || '…';
    memory.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
    while (memory.messages.length > 14) memory.messages.shift();
    memory.lastUpdated = new Date();
    await memory.save();
    return reply;
  } catch (e) {
    logger.warn(`Hinata AI error: ${e.message}`);
    return 'Mmm, my brain is fuzzy right now… try again in a bit? 🌸';
  }
}

module.exports = { getHinataReply, detectMood };
