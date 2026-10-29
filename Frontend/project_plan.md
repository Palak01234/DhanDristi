# DhanDrishti — Smart Currency Recognition System for Visually Impaired Users

## 1. Project Description

DhanDrishti is an AI-powered assistive mobile-web application that helps visually impaired / low-vision users independently identify paper currency and hear a clear voice announcement. Core flow: smartphone camera detection → YOLO currency recognition → denomination + confidence → voice announcement.

Product positioning: an accessibility-first utility app. Priority is simplicity, one-handed use, high contrast, large touch targets, and real Kannada-first spoken feedback — not decoration.

## 2. Page Structure

Pre-auth flow:
- `/` - Splash (logo, tagline "See Money. Hear Money.")
- `/onboarding` - Onboarding (Currency Recognition, Voice Results, Currency Selection, Offline Recognition)
- `/login` - Login (email/password, show-hide, forgot, Google placeholder, create account)
- `/signup` - Sign up (name, email, phone, password, confirm, terms)
- `/preferences/currency` - Currency Preference Setup (Single / Multi / Auto; INR, USD, PHP, EUR, AUD, CAD)
- `/preferences/denomination` - Denomination preferences (all or selected)

Main app (authenticated / guided):
- `/home` - Home dashboard (selected currency, voice status, model/offline status, big SCAN action)
- `/scan` - Currency scanner (full-screen camera UI)
- `/scan/result` - Detection result (success / low-confidence / wrong-currency / automatic / multiple)
- `/convert` - Currency converter (from, amount, target, rate, online/offline, swap, speak)
- `/history` - Detection history (filter + detail)
- `/settings` - Settings (voice, speed, volume, vibration, high contrast, large text, confidence threshold, auto scan, offline model, exchange-rate data, clear history, privacy, logout)
- `/profile` - Profile (name, email, phone, detection currency, conversion currency, mode)
- `/help` - Help & accessibility
- `/admin` - Admin dashboard (protected: users, scans, stats, currency usage, low-confidence, model performance)

## 3. Core Features

- [ ] Provider-based Text-to-Speech architecture (AI first, device fallback). Kannada (kn-IN) first-class.
- [ ] Voice settings: language tabs, gender filter, search, preview, speed/volume, AI vs device source, auto-speak, repeat result, vibration
- [ ] Voice registry mapping friendly personas to real provider voice ids (Google Cloud Chirp3-HD), with honest AI/Device labelling
- [ ] Different voice behaviour: normal / low-confidence warning / wrong-currency attention / error / confirmation
- [ ] Live camera scanner with permission states, positioning guide, flashlight, large scan control
- [ ] Detection result states: success, low confidence, wrong currency, automatic, multiple notes (total)
- [ ] Currency converter with online/offline rate status and speak result
- [ ] Detection history (currency, denomination, confidence, timestamp, status, user id; no images stored)
- [ ] Currency & denomination preferences + conversion currency (persisted per user)
- [ ] Accessibility: semantic HTML, ARIA, keyboard nav, 48px targets, high contrast, large text, focused states
- [ ] Bonus: offline model indicator, exchange-rate data setting

## 4. Data Model Design

Backend-ready (Node.js/Express + MongoDB on the user's own backend; frontend talks via API services only). Frontend never holds DB credentials.

### Collection: users
| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Primary key |
| name | string | Display name |
| email | string | Unique login email |
| phone | string | Contact phone |
| passwordHash | string | Hashed credential |
| role | enum | `user` / `admin` |
| createdAt | Date | Created timestamp |
| lastLoginAt | Date | Last login |

### Collection: userpreferences
| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Primary key |
| userId | ObjectId | Ref -> users |
| detectionCurrency | string | e.g. `INR` |
| detectionMode | enum | `single` / `multiple` / `automatic` |
| selectedCurrencies | string[] | Supported currency codes |
| selectedDenominations | string[] | Denomination values |
| conversionCurrency | string | Default target currency |
| voice = { language, voiceURI, speed, volume, autoSpeak, repeatResult, vibration } | object | Voice settings |
| accessibility = { highContrast, largeText } | object | Display settings |
| confidenceThreshold | number | Min confidence (0-1) |
| autoScan | boolean | Auto re-scan |
| exchangeRateData | enum | `online` / `offline` / `cached` |

### Collection: detectionhistory
| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Primary key |
| userId | ObjectId | Ref -> users |
| currency | string | Detected currency code |
| denomination | number | Face value |
| confidence | number | 0-1 |
| status | enum | `success` / `low_confidence` / `wrong_currency` / `error` |
| source | enum | `camera` / `manual` |
| createdAt | Date | Timestamp |

### Collection: appstats (admin)
Aggregated counts: total users, total scans, per-currency usage, low-confidence rate, per-denomination accuracy, model performance metrics.

## 5. Backend / Third-party Integration Plan
- Database: Connect user's own Supabase-compatible backend (chosen by user). Auth + persistence via Supabase-compatible client. The plan also documents a Node.js/Express + MongoDB reference API for deployment outside the web app.
- Voice: Provider-based AI TTS architecture. Primary = Google Cloud Text-to-Speech via a secure Supabase Edge Function (`/functions/v1/tts`) that owns `GOOGLE_TTS_API_KEY` in Secrets — the frontend never sees the key. Falls back to device/web speech synthesis, clearly labelled "Device voice". Kannada is sent in native script, never silently romanized (opt-in romanized fallback only). ElevenLabs can be added as a secondary provider when configured.
- No Shopify / Stripe / payments.

## 6. Development Phase Plan

### Phase 1 — Core flow (current)
- Goal: working core user journey with mock ML data and real device voice.
- Deliverable: Splash, Onboarding, Login/Signup (UI), Home, Scanner, Detection Result states, converter, dynamic voice system, accessible bottom nav. Backend service layer ready for Supabase connection.

### Phase 2 — Account & persistence
- Goal: connect Supabase-compatible backend; real signup/login, save preferences, detection history, profile.
- Deliverable: Supabase client, auth guard, history & preferences persistence.

### Phase 3 — Settings & accessibility depth
- Goal: full settings page, high contrast / large text modes, admin dashboard.
- Deliverable: complete Settings, Profile, Help, Admin analytics.

### Phase 4 — ML integration
- Goal: swap mock inference for real YOLO model via API.
- Deliverable: ML inference service abstraction, confidence handling, offline model indicator.