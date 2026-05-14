# ROSE_CHATBOT

<div align="center">

<img src="https://i.ibb.co/8gyrjZhk/image.jpg" alt="Hinata Bot Banner" width="100%" style="border-radius: 20px;" />

<br/>

```
 ██╗  ██╗██╗███╗   ██╗ █████╗ ████████╗ █████╗ 
 ██║  ██║██║████╗  ██║██╔══██╗╚══██╔══╝██╔══██╗
 ███████║██║██╔██╗ ██║███████║   ██║   ███████║
 ██╔══██║██║██║╚██╗██║██╔══██║   ██║   ██╔══██║
 ██║  ██║██║██║ ╚████║██║  ██║   ██║   ██║  ██║
 ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═╝   ╚═╝  ╚═╝
```

### 🌺 *ᴀɴ ᴀʟʟ-ɪɴ-ᴏɴᴇ ᴛᴇʟᴇɢʀᴀᴍ ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ ʙᴏᴛ — ʀᴏsᴇ ʟᴇᴠᴇʟ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ* 🌺

<br/>

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Telegraf](https://img.shields.io/badge/Telegraf-4.x-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-ff69b4?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)

<br/>

> *"ѕнє'ѕ иσт נυѕт α вσт — ѕнє'ѕ тнє ρяσтєcтσя σf уσυя ɢяσυρ"* 👑

</div>

---

<div align="center">

## ✨ᴡʜᴀᴛ ɪs ʜɪɴᴀᴛᴀ?✨

</div>

**Hinata** is a **Rose-level Telegram group management bot** built with **Node.js + Telegraf**. Designed to be the ultimate guardian of your Telegram groups — she brings powerful moderation, animated interactions, smart group controls, and a personality that makes her unforgettable.

She boots up with a cinematic sticker animation, greets every user by name, and keeps your group clean, safe, and organized — all while looking absolutely stunning doing it. 🌸

---

<div align="center">

## 🌸 ꜰᴇᴀᴛᴜʀᴇ ꜱʜᴏᴡᴄᴀꜱᴇ

</div>

### 🎬 Animated Startup Experience
> Every `/start` command triggers a **full cinematic entrance**:
- 🖼️ Sends a custom sticker from your sticker set
- ✨ Plays 8-frame loading animation with Unicode art text
- 🌺 Reveals a styled welcome card with live bot stats (uptime, heap, Node version, hostname)
- 📸 Delivers a spoiler photo with an inline keyboard — all fully automated

---

### 🛡️ Group Moderation
> Rose-level moderation power at your fingertips:

| Feature | Description |
|---|---|
| 👮 **Admin Tools** | Promote, demote, and manage admins effortlessly |
| 🔇 **Mute / Unmute** | Silence disruptive members |
| 🚫 **Ban / Unban** | Instantly remove bad actors |
| 👟 **Kick** | Remove users without permanent ban |
| 🔒 **Lock / Unlock** | Restrict what members can send (media, stickers, links) |
| 🌊 **Anti-Flood** | Auto-punish users spamming messages |
| 📋 **Group Rules** | Set and share group rules via deep-link `/start rules_<chatId>` |

---

### 🤖 Smart Features

| Feature | Description |
|---|---|
| 📝 **Notes** | Save and retrieve group notes on demand |
| 🔍 **Filters** | Auto-reply when trigger words are sent |
| 👋 **Welcome / Goodbye** | Custom messages for joining/leaving members |
| 🔗 **Deep Links** | Share group rules via `t.me/bot?start=rules_<id>` |
| 🌐 **Connection Mode** | Manage group settings from your DMs |
| 📊 **Live Stats** | Real-time uptime, memory usage, Node.js version |

---

### ⚡ Technical Power

| Spec | Detail |
|---|---|
| 🟢 **Runtime** | Node.js v22.x |
| 🤖 **Framework** | Telegraf 4.x |
| 🗄️ **Database** | MongoDB (via Mongoose) |
| 🧠 **Memory Tracking** | Live heap usage reported on start |
| 🔧 **Config** | Environment-based `.env` configuration |
| 🖼️ **Stickers** | Dynamic sticker fetching via Telegram API |
| 🏗️ **Architecture** | Modular handler-based structure |

---

<div align="center">

## 🚀 ɢᴇᴛᴛɪɴɢ ꜱᴛᴀʀᴛᴇᴅ

</div>

### 📋 Prerequisites

- Node.js `v18+` (v22 recommended)
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- MongoDB URI (local or Atlas)

---

### 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/ragini19854-prog/ROSE_CHATBOT.git
cd ROSE_CHATBOT

# 2. Install dependencies
npm install

# 3. Set up your environment variables
cp .env.example .env
```

---

### ⚙️ Environment Variables

Create a `.env` file in the root directory and fill in:

```env
# ──────────────────────────────
# 🤖 BOT CORE
# ──────────────────────────────
BOT_TOKEN=your_telegram_bot_token_here
OWNER_ID=your_telegram_user_id_here

# ──────────────────────────────
# 🗄️ DATABASE
# ──────────────────────────────
MONGO_URI=mongodb://localhost:27017/hinata

# ──────────────────────────────
# 🎨 CUSTOMIZATION (optional)
# ──────────────────────────────
START_IMAGE_URL=https://i.ibb.co/PsVzsK8x/image.jpg
START_STICKER_SET=Koylakoyla_by_fStikBot
```

---

### ▶️ Running the Bot

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

---

<div align="center">

## 📁 ᴘʀᴏᴊᴇᴄᴛ ꜱᴛʀᴜᴄᴛᴜʀᴇ

</div>

```
ROSE_CHATBOT/
│
├── 📂 src/
│   ├── 📂 handlers/
│   │   ├── 📂 commands/
│   │   │   ├── 🌸 start.js          ← Animated startup command
│   │   │   ├── 🛡️ ban.js            ← Ban/unban handlers
│   │   │   ├── 🔇 mute.js           ← Mute/unmute handlers
│   │   │   └── 📋 rules.js          ← Group rules handler
│   │   └── 📂 callbacks/
│   │       └── 💬 help.js           ← Help menu callback
│   │
│   ├── 📂 utils/
│   │   ├── 🔧 helpers.js            ← formatDuration, escapeHtml
│   │   └── 🏘️ groupSettings.js      ← Group DB operations
│   │
│   ├── 📂 models/                   ← MongoDB Mongoose models
│   ├── 📂 middleware/               ← Bot middleware (auth, logging)
│   ├── 📂 config/
│   │   └── ⚙️ index.js              ← Central config (ownerId, etc.)
│   │
│   └── 🤖 bot.js                    ← Bot entry point
│
├── 📄 package.json
├── 📄 .env.example
└── 📄 README.md
```

---

<div align="center">

## 🌺 ᴄᴏᴍᴍᴀɴᴅ ʟɪꜱᴛ

</div>

### 👤 General Commands

| Command | Description |
|---|---|
| `/start` | Launch Hinata with full animation |
| `/help` | View all available commands |
| `/rules` | View the group rules |

### 👮 Admin Commands

| Command | Description |
|---|---|
| `/ban` | Ban a user from the group |
| `/unban` | Unban a previously banned user |
| `/kick` | Kick a user (they can rejoin) |
| `/mute` | Mute a user |
| `/unmute` | Unmute a user |
| `/promote` | Promote a user to admin |
| `/demote` | Demote an admin |

### ⚙️ Group Management

| Command | Description |
|---|---|
| `/setrules` | Set the group rules |
| `/lock` | Lock a specific chat type |
| `/unlock` | Unlock a specific chat type |
| `/filters` | List all active filters |
| `/notes` | List saved notes |

---

<div align="center">

## 💡 ʜᴏᴡ ᴅᴇᴇᴘ ʟɪɴᴋꜱ ᴡᴏʀᴋ

</div>

Hinata supports **Telegram deep links** for sharing group rules directly:

```
https://t.me/YourBotUsername?start=rules_-1001234567890
```

When a user clicks this link:
1. Hinata opens in their DM
2. She automatically fetches the rules for that specific group
3. Displays them beautifully formatted — no commands needed

---

<div align="center">

## 🎬 ꜱᴛᴀʀᴛᴜᴘ ᴀɴɪᴍᴀᴛɪᴏɴ ꜰʟᴏᴡ

</div>

```
User sends /start
       │
       ▼
┌─────────────────┐
│  Send Sticker   │  ← Fetched live from Telegram API
│   (2 seconds)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Loading Frame Animation       │
│                                     │
│  нℓσ вαву ✨  →  ℓσα∂ιиɢ.         │
│  ℓσα∂ιиɢ.. →  ℓσα∂ιиɢ...          │
│  нιиαтα  →  нιиαтα χ               │
│  нιиαтα χ ιиfιиιту  →  ѕтαятє∂ 👑 │
│                                     │
│  (200ms per frame × 8 frames)       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Welcome Card + Inline Menu      │
│                                     │
│  🌺 Hey, [Name]! I am Hinata ✨     │
│  ➥ Uptime / Heap / Node / Host      │
│  📸 Spoiler photo with buttons      │
└─────────────────────────────────────┘
```

---

<div align="center">

## 🤝 ᴄᴏɴᴛʀɪʙᴜᴛɪɴɢ

</div>

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

<div align="center">

## 📞 ꜱᴜᴘᴘᴏʀᴛ & ʟɪɴᴋꜱ

</div>

<div align="center">

[![Telegram Channel](https://img.shields.io/badge/Channel-Join%20Us-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/+1NRRqUd1replNTM1)
[![Website](https://img.shields.io/badge/Website-Visit-ff69b4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://gmsxabouttgaura.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/ragini19854-prog/ROSE_CHATBOT)

</div>

---

<div align="center">

## ⚖️ ʟɪᴄᴇɴꜱᴇ

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

```
┌──────────────────────────────────────────┐
│                                          │
│   🌺 ᴘᴏᴡєʀєᴅ ʙʏ  |𝐌 ᴀ ᴅ ᴀ ʀ ᴀ •|    │
│                                          │
│      ʙᴜɪʟᴛ ᴡɪᴛʜ ❤️ ꜰᴏʀ ᴛᴇʟᴇɢʀᴀᴍ       │
│                                          │
└──────────────────────────────────────────┘
```

*ѕтαятє∂ 👑 — нιиαтα χ ιиfιиιту*

</div>
