# ROSE_CHATBOT

# 🌸 Hinata Bot - Ultimate Telegram Group Guardian

![Hinata](https://img.shields.io/badge/Hinata-Powered%20by%20Groq-blue?style=for-the-badge&logo=telegram)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-black?style=for-the-badge&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Production-grade all-in-one Telegram bot with Rose-level moderation + Groq AI protection + Games + Economy**

---

## ✨ Features

### 🛡️ Advanced Group Management (Rose Bot Level)
- Full admin commands (`/ban`, `/mute`, `/warn`, `/promote`, `/purge` etc.)
- Anti-flood, Anti-raid, Anti-spam, Captcha
- Filters, Notes, Welcome/Goodbye, Rules, Slowmode, Locks

### 🔥 Groq AI Content Protection
- Real-time NSFW/Gore/Scam/Toxic detection on **text, images, stickers, GIFs, videos**
- OCR + Vision scanning
- **Deletes illegal content even from Admins** (no punishment on admins)

### 🎮 Games & Economy System
- Anime/Movie Guess • Trivia • WordGuess • Word Streak
- Wallet, Daily/Weekly rewards, Leaderboards, Transactions

### 💬 AI Chatbot (Hinata Persona)
- Memory + Context • Group & Private • Mention / Reply / Trigger

---

## 🛠 Tech Stack

- **Runtime**: Node.js + Telegraf
- **AI**: Groq SDK (Llama 3.1 + Vision)
- **DB**: MongoDB with Mongoose
- **Queue**: BullMQ (heavy AI jobs)
- **Logging**: Winston
- **Image**: Sharp + Tesseract.js

---

## 🚀 Quick Start

```bash
git clone https://github.com/yourusername/hinata-bot.git
cd hinata-bot
npm install
cp .env.example .env
