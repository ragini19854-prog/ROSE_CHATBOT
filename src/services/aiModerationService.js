const Groq = require('groq-sdk');
const config = require('../config/index');
const logger = require('../utils/logger');

const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const HARD_RULES = [
  /\bcp\b/i,
  /\bchild\s*(porn|sex|abuse|exploit)/i,
  /\bsuicide\s+method/i,
  /\bloli(con)?\b/i,
  /\bshota\b/i,
];

const NSFW_EMOJI = new Set([
  '🍆','🍑','💦','🔞','🤤','🥵','👅','🍌',
]);

const TEXT_SYSTEM = `You are a strict content moderator for a Telegram group. Reply with exactly ONE word and NOTHING else.

Reply "NSFW" if the message contains ANY of:
- Sexual / pornographic content, innuendo, or solicitation (in any language)
- Drug promotion or sale (cocaine, meth, heroin, LSD, MDMA, weed for sale, dealer offers)
- Child exploitation or sexualization of minors
- Gore, graphic violence, torture
- Hate speech, slurs, calls for violence against a group
- Scams, phishing, fake-investment, "earn money" links
- Self-harm encouragement or suicide methods
- Doxxing / sharing private personal data

Reply "SAFE" otherwise.

Casual cursing, normal flirting, mature topics discussed neutrally → SAFE.
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

async function scanText(text) {
  if (!text) return false;
  for (const re of HARD_RULES) if (re.test(text)) return true;
  for (const ch of text) if (NSFW_EMOJI.has(ch)) {
    // emoji alone isn't nuke-worthy; let LLM decide context
    break;
  }
  if (!groq) return false;
  try {
    const res = await groq.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0,
      max_tokens: 4,
      messages: [
        { role: 'system', content: TEXT_SYSTEM },
        { role: 'user', content: text.slice(0, 1500) },
      ],
    });
    const out = (res.choices[0]?.message?.content || '').trim().toUpperCase();
    return out.startsWith('NSFW');
  } catch (e) {
    logger.warn(`Groq text-moderation error: ${e.message}`);
    return false;
  }
}

async function scanImage(imageBuffer, mime = 'image/jpeg') {
  if (!groq || !imageBuffer) return false;
  try {
    const b64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;
    const res = await groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      max_tokens: 4,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_SYSTEM + '\n\nClassify this image:' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });
    const out = (res.choices[0]?.message?.content || '').trim().toUpperCase();
    return out.startsWith('NSFW');
  } catch (e) {
    logger.warn(`Groq vision-moderation error: ${e.message}`);
    return false;
  }
}

// keep backward-compat name used by existing middleware
const scanContent = scanText;

module.exports = { scanText, scanImage, scanContent };
