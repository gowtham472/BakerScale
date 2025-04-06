# BakerScale

Accurate Ingredient Measurement for Better Baking

BakerScale is an intelligent web application that helps users convert, scale, and manage baking ingredients with precision using AI. Designed for bakers of all skill levels, BakerScale eliminates guesswork and supports global units, image/voice/text inputs, and regional conversions — all in one place.

---

## Google Solution Challenge 2025

This project is proudly built as a part of the Google Solution Challenge 2025, aligned with the United Nations Sustainable Development Goals (SDGs). BakerScale aims to:

- Reduce food waste through accurate measurement and scaling.
- Promote responsible consumption (SDG 12).
- Empower home-based and small-scale bakers with accessible technology (SDG 8).

---

## Features

- AI-Powered Unit Conversion – Convert ingredients between volume and weight using real-time AI and density data.
- Image-Based Recognition – Upload or capture an ingredient or baked product to get ingredient details or full recipes.
- Voice/Text Input – Input ingredients in natural language or via voice for effortless conversions.
- Region-Aware Units – Adjust ingredient measurements according to local conventions (e.g., grams vs. cups).
- Gemini AI Integration – Uses Google’s Gemini API for intelligent ingredient extraction and recipe scaling.
- Firestore & Cloud Functions – Efficient backend with Firebase for secure data handling and real-time updates.
- Local Recipe Storage – Save detected or custom recipes directly into your account.

---

## Tech Stack

- Frontend: Angular (Standalone Components), Tailwind CSS
- Backend: Firebase (Cloud Functions, Firestore, Authentication, Storage)
- AI Services: Google Gemini API, Google Cloud Vision
- Hosting: Firebase Hosting

---

## Getting Started

```bash
git clone https://github.com/yourusername/bakerscale.git
cd bakerscale
npm install
ng serve
Set up Firebase project, Gemini API access, and configure environment variables before running.
