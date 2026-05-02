const logger  = require('../utils/logger');
const limiter = require('../utils/groqLimiter');

const TEXT_MODEL   = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Hard timeout for every AI call — if AI doesn't respond in time, fail open (SAFE)
const AI_TIMEOUT_MS = 5_000;

const HARD_RULES = [
  /\bcp\b/i,
  /\bchild\s*(porn|sex|abuse|exploit)/i,
  /\bsuicide\s+method/i,
  /\bloli(con)?\b/i,
  /\bshota\b/i,
];

const NSFW_EMOJI = new Set(['🍆','🍑','💦','🔞','🤤','🥵','👅','🍌']);

const TEXT_SYSTEM = `You are a strict content moderator for a Telegram group. Reply with exactly ONE word and NOTHING else.

Reply "NSFW" ONLY if the message contains:
- Explicit sexual / pornographic content, sexual solicitation, or graphic sexual descriptions
- Drug promotion, sale, or dealing (cocaine, meth, heroin, weed for sale, drug dealer ads)
- Child exploitation or sexualization of minors in any form
- Extreme gore, graphic torture, or snuff content
- Calls for real violence or murder against a specific person/group
- Scams, phishing, fake-investment, or "earn easy money" spam links
- Self-harm methods or suicide instructions
- Doxxing / sharing someone's private personal data without consent

Reply "SAFE" for everything else, including:
- Casual slang, swearing, profanity, abusive language between users (fully allowed)
- Memes, jokes, dark humor, roasts, trash-talk
- Normal flirting, mild sexual innuendo, adult jokes (not graphic)
- Violent gaming language ("I'll kill you in this match", "GG ez rekt")
- Angry rants or arguments
- Discussing drugs in a news / educational context

Reply ONLY the single word: NSFW or SAFE.`;

const VISION_SYSTEM = `You are a strict visual content moderator for a Telegram group. Reply with exactly ONE word and NOTHING else.

Reply "NSFW" if the image contains ANY of:
- Nudity, sexual / pornographic content, suggestive poses, lingerie modeling, fetish content
- Drugs (powder, syringes, pills with intent to consume, bongs, smoking weed, drug deals)
- Gore, blood, mutilation, dead bodies, execution, severe injury
- Sexual or sexualized depiction of minors (any cartoon/anime/AI character that looks under 18)
- Hate symbols (Nazi swastika, KKK, ISIS flag), explicit hate imagery
- Real or graphic violence, torture, animal cruelty
- Solicitation imagery, phone numbers + sexual context, escort ads

Reply "SAFE" otherwise — including normal selfies, memes, anime art that is fully clothed and non-sexual, food, landscapes, pets, screenshots of normal text, etc.

Reply ONLY the single word: NSFW or SAFE.`;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function scanText(text) {
  if (!text) return false;
  for (const re of HARD_RULES) if (re.test(text)) return true;
  try {
    const res = await withTimeout(
      limiter.call((groq) =>
        groq.chat.completions.create({
          model: TEXT_MODEL,
          temperature: 0,
          max_tokens: 4,
          messages: [
            { role: 'system', content: TEXT_SYSTEM },
            { role: 'user',   content: text.slice(0, 1500) },
          ],
        })
      ),
      AI_TIMEOUT_MS
    );
    const out = (res.choices[0]?.message?.content || '').trim().toUpperCase();
    return out.startsWith('NSFW');
  } catch (e) {
    logger.warn(`Groq text-moderation error: ${e.message?.slice(0, 120)}`);
    return false; // fail open — never block a message because AI is down
  }
}

async function scanImage(imageBuffer, mime = 'image/jpeg') {
  if (!imageBuffer) return false;
  try {
    const b64     = imageBuffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;
    const res = await withTimeout(
      limiter.call((groq) =>
        groq.chat.completions.create({
          model: VISION_MODEL,
          temperature: 0,
          max_tokens: 4,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text',      text: VISION_SYSTEM + '\n\nClassify this image:' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
        })
      ),
      AI_TIMEOUT_MS
    );
    const out = (res.choices[0]?.message?.content || '').trim().toUpperCase();
    return out.startsWith('NSFW');
  } catch (e) {
    logger.warn(`Groq vision-moderation error: ${e.message?.slice(0, 120)}`);
    return false; // fail open
  }
}

const scanContent = scanText;
module.exports = { scanText, scanImage, scanContent };
