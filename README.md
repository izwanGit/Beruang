<p align="center">
  <img src="assets/chatbot_mascot.png" alt="Beruang Logo" width="150" height="150" style="border-radius: 50%"/>
</p>

<h1 align="center">🐻 Beruang</h1>

<p align="center">
  <strong>Your Friendly AI-Powered Personal Finance Companion</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.82.0-blue?style=flat-square&logo=react" alt="React Native"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Firebase-12.5-orange?style=flat-square&logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"/>
</p>

---

## 📖 Table of Contents

- [About The Project](#about-the-project)
  - [What is Beruang?](#what-is-beruang)
  - [Why Beruang?](#why-beruang)
  - [Target Audience](#target-audience)
- [Features](#features)
  - [Core Features](#core-features)
  - [AI Features](#ai-features)
  - [Gamification](#gamification)
  - [Smart Widgets](#smart-widgets)
- [Demo](#demo)
  - [Screenshots](#screenshots)
  - [Video Walkthrough](#video-walkthrough)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the App](#running-the-app)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [AI Pipeline](#ai-pipeline)
  - [Data Flow](#data-flow)
- [Project Structure](#project-structure)
  - [Directory Layout](#directory-layout)
  - [Screens](#screens)
  - [Components](#components)
  - [Widgets](#widgets)
- [Core Concepts](#core-concepts)
  - [50/30/20 Budget Rule](#503020-budget-rule)
  - [Transaction Categories](#transaction-categories)
  - [Budget Rebalancing](#budget-rebalancing)
- [AI Integration](#ai-integration)
  - [Receipt Scanning](#receipt-scanning)
  - [Transaction Classification](#transaction-classification)
  - [Intelligent Chatbot](#intelligent-chatbot)
  - [Smart Widgets](#smart-widgets-1)
- [API Reference](#api-reference)
  - [REST Endpoints](#rest-endpoints)
  - [Streaming Endpoints](#streaming-endpoints)
  - [Request/Response Examples](#requestresponse-examples)
- [Firebase Configuration](#firebase-configuration)
  - [Authentication](#authentication)
  - [Firestore Schema](#firestore-schema)
  - [Security Rules](#security-rules)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [E2E Tests](#e2e-tests)
- [Deployment](#deployment)
  - [iOS App Store](#ios-app-store)
  - [Google Play Store](#google-play-store)
  - [Backend Deployment](#backend-deployment)
- [Performance Optimization](#performance-optimization)
  - [Frontend Optimizations](#frontend-optimizations)
  - [Backend Optimizations](#backend-optimizations)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## 🎯 About The Project

### What is Beruang?

**Beruang** (meaning "Bear" in Malay 🐻) is an AI-powered personal finance management mobile application designed specifically for young Malaysian adults. The app combines modern budgeting principles with artificial intelligence to provide a seamless, intelligent, and gamified experience for managing personal finances.

Unlike traditional expense trackers, Beruang features:
- **AI-Powered Receipt Scanning**: Driven by **Gemini 2.5 Flash** for instant merchant and amount extraction
- **Grok-Powered Chatbot**: Real-time financial advice with **Server-Sent Events (SSE)** streaming
- **Automatic Transaction Classification**: TensorFlow-powered local model for 50/30/20 categorization
- **Smart Visual Widgets**: Interactive AI-generated charts for spending, goals, and itineraries
- **Evolutionary Gamification**: 13-stage bear evolution system with XP rewards and overspending penalties
- **Historical Analysis**: Deep insights into spending trends across multiple months
- **Knowledge Base**: Save and revisit AI advice with full visual widget rendering

### Why Beruang?

| Problem | Beruang's Solution |
|---------|-------------------|
| Manual expense entry is tedious | 📸 AI-powered receipt scanning |
| Hard to track spending patterns | 📊 Automatic categorization & insights |
| Generic financial advice | 🤖 Context-aware AI chatbot with your data |
| Boring finance apps | 🎮 Gamification with XP & avatar evolution |
| Complex budget allocation | ⚖️ Automatic 50/30/20 budget rebalancing |

### Target Audience

Beruang is designed for:
- **Young Adults (18-30)**: First-time income earners, students, fresh graduates
- **Malaysians**: Localized for Malaysian Ringgit (RM), Malaysian banks, and local context
- **Beginners**: No prior financial knowledge required
- **Mobile-first Users**: Designed for on-the-go expense tracking

---

## ✨ Features

### Core Features

#### 📊 Dashboard & Budget Tracking
- Real-time budget overview with the **50/30/20 rule**
- Interactive donut charts showing spending distribution
- Monthly budget targets with progress indicators
- Color-coded categories (Needs: Red, Wants: Orange, Savings: Green)

#### 💰 Transaction Management
- **Add Income**: Track all income sources
- **Add Expenses**: Quick expense entry with automatic categorization
- **Edit/Delete**: Full CRUD operations on transactions
- **Search & Filter**: Find transactions by name, date, or category
- **Bulk Import**: Import multiple transactions at once via AI

#### 📸 Receipt Scanning
- Capture receipt photos with your camera
- AI extracts: Amount, Merchant, Description, Date
- Automatic category suggestion
- One-tap to add the transaction

#### 💾 Savings Goals
- Create custom savings goals
- Track progress with visual indicators
- Automatic leftover allocation
- Goal completion celebrations

### AI Features

#### 🤖 Intelligent Chatbot (Grok 4.1 Fast)
- **Context-Aware**: Knows your full transaction history, multi-month budget, and finance persona
- **Real-Time Streaming**: Responses stream in character-by-character using SSE
- **Historical Analysis**: Proactively compares current spending with past months
- **Visual Widgets**: Generates 4 types of interactive charts on demand
- **Knowledge Base**: Conversations are searchable and saved for offline reference

#### 🧠 Transaction Classification (TF.js)
- TensorFlow Lite model running natively on-device
- Dual-output classification (Category + Subcategory)
- 99%+ accuracy on local Malaysian merchants and services
- Zero-latency offline categorization

#### 📈 Smart Visual Widgets
The chatbot generates dynamic UI blocks based on context:
- **Spending Summary (`s`)**: Deep breakdown of Needs vs Wants vs Savings
- **Daily Transactions (`d`)**: List view of specific dates with net balance
- **Itinerary Planner (`i`)**: Cost-aware activity timeline for trips
- **Goal Progress (`g`)**: Visual tracker for specific savings targets

### Gamification

#### 🎮 XP & Level System
| Action | XP Reward |
|--------|-----------|
| Log a single transaction | **+50 XP** |
| Save money (per RM 1.00) | **+2 XP** |
| Chat session with Beruang | **+100 XP** |
| Daily app check-in | **+20 XP** |
| **Overspending Penalty** | **-200 XP** |

#### 🐻 Evolution Stages
Your bear evolves through **13 unique stages** based on your total XP:
- **Cub Stages (Level 1-4)**: The journey begins
- **Teen Stages (Level 5-8)**: Gaining financial wisdom
- **Adult Stages (Level 9-12)**: Master of the 50/30/20 rule
- **Ultimate Stage (Level 13)**: **The Golden Bear** 🐻✨

### Smart Widgets

Beruang's AI chatbot can generate beautiful visual widgets:

#### 1. Spending Summary (`type: 's'`)
```json
{
  "t": "s",
  "d": [{"c": "Food", "a": 200}, {"c": "Transport", "a": 100}],
  "p": 85
}
```
Displays a pie chart with category breakdown.

#### 2. Itinerary (`type: 'i'`)
```json
{
  "t": "i",
  "name": "Trip to KL",
  "items": [{"d": "Day 1", "v": "50"}, {"d": "Day 2", "v": "100"}]
}
```
Shows a timeline with budget estimates.

#### 3. Goal Progress (`type: 'g'`)
```json
{
  "t": "g",
  "name": "New Phone",
  "cur": 500,
  "tar": 2000
}
```
Displays a progress bar towards your goal.

#### 4. Daily Transactions (`type: 'd'`)
```json
{
  "t": "d",
  "date": "Jan 3, 2026",
  "items": [
    {"n": "Carried Over", "a": 28.90, "type": "income"},
    {"n": "Ayam gepuk meal", "a": -12.50, "type": "expense", "cat": "Needs"}
  ],
  "net": 16.40
}
```
Shows a card with date-specific transactions.

---

## 📱 Demo

### Screenshots

| Home Screen | Expenses | Chatbot | Profile |
|-------------|----------|---------|---------|
| Dashboard with budget overview | Transaction list with filters | AI chat with widgets | User profile & settings |

### Video Walkthrough

> 🎬 *Coming soon: Full video walkthrough of all features*

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.x ([Download](https://nodejs.org/))
- **npm** or **yarn**: Package manager
- **React Native CLI**: `npm install -g @react-native-community/cli`
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development
- **CocoaPods**: For iOS dependencies (`gem install cocoapods`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/izwanGit/Beruang.git
   cd Beruang
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies (macOS only)**
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password, Google Sign-In)
   - Create a Firestore database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories

5. **Configure Backend URL**
   ```bash
   cp src/config/urls.example.ts src/config/urls.ts
   # Edit urls.ts with your backend URL
   ```

### Environment Setup

Create a `firebaseConfig.js` file in the root directory:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Running the App

#### Start Metro Bundler
```bash
npm start
```

#### Run on iOS
```bash
npm run ios
```

#### Run on Android
```bash
npm run android
```

#### Run on Physical Device
1. Connect your device via USB
2. Enable Developer Mode
3. Run `npm run ios` or `npm run android`

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      BERUANG ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Mobile    │     │   Backend   │     │   AI Services   │   │
│  │   App       │◄───►│   Server    │◄───►│                 │   │
│  │  (RN/TS)    │     │  (Node.js)  │     │  Grok + Gemini  │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│         │                   │                                   │
│         │                   │                                   │
│         ▼                   ▼                                   │
│  ┌─────────────┐     ┌─────────────┐                           │
│  │  Firebase   │     │ TensorFlow  │                           │
│  │ (Auth/DB)   │     │  (Local AI) │                           │
│  └─────────────┘     └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

The mobile app follows a **component-based architecture**:

```
src/
├── screens/           # Full-page components (views)
├── components/        # Reusable UI components
│   └── widgets/       # AI-generated visual widgets
├── constants/         # Colors, themes, constants
├── config/            # API URLs, configuration
├── utils/             # Helper functions
└── styles/            # Global styles
```

### Backend Architecture

The backend (`beruang-server`) is a **unified Node.js server**:

```
beruang-server/
├── server.js            # Main server file
├── model_intent/        # Intent classification model
├── model_transaction/   # Transaction classification model
├── expert_tips.json     # Financial advice database
├── dosm_data.json       # Malaysian statistics (RAG)
└── responses.json       # Local response templates
```

### AI Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│   Intent    │───►│   Router    │
│   Input     │    │   Detect    │    │             │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
                          ▼                   ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   Local     │    │   Grok      │    │   Gemini    │
                   │   Response  │    │   API       │    │   Vision    │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

### Data Flow

1. **User Action** → React Native Component
2. **Component** → Firebase (for data) or Backend API (for AI)
3. **Backend** → Local AI or Cloud AI (Grok/Gemini)
4. **Response** → Stream back to app via SSE
5. **App** → Render response with widgets

---

## 📁 Project Structure

### Directory Layout

```
Beruang/
├── App.tsx                    # Main app component & navigation
├── index.js                   # Entry point
├── package.json               # Dependencies
├── firebaseConfig.js          # Firebase configuration
├── tsconfig.json              # TypeScript configuration
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro bundler configuration
│
├── src/
│   ├── screens/               # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ExpensesScreen.tsx
│   │   ├── ChatbotScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SavingsScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   ├── AddMoneyScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   └── SavedAdviceScreen.tsx
│   │
│   ├── components/            # Reusable components
│   │   ├── SmartWidget.tsx
│   │   ├── DonutChart.tsx
│   │   ├── MessageModal.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── AvatarPickerModal.tsx
│   │   ├── InitialBalanceModal.tsx
│   │   ├── BalanceAllocationModal.tsx
│   │   └── widgets/
│   │       ├── SpendingSummaryWidget.tsx
│   │       ├── ItineraryWidget.tsx
│   │       ├── GoalProgressWidget.tsx
│   │       └── DailyTransactionsWidget.tsx
│   │
│   ├── constants/
│   │   └── colors.ts          # Color palette
│   │
│   ├── config/
│   │   └── urls.ts            # API endpoints
│   │
│   ├── utils/
│   │   ├── financeUtils.ts    # 50/30/20 calculation engine
│   │   ├── gamificationUtils.ts # XP & Level core logic
│   │   └── categorization.ts  # Local TF.js classification wrapper
│   │
│   └── styles/
│       └── globalStyles.ts    # Shared theme tokens
│
├── assets/
│   ├── avatars/               # Bear avatar images
│   ├── images/                # App images
│   ├── chatbot_mascot.png     # Chatbot avatar
│   └── wallpaper.png          # Chat background
│
├── android/                   # Android native code
├── ios/                       # iOS native code
└── docs/                      # Documentation
```

### Screens

| Screen | Description | Key Features |
|--------|-------------|--------------|
| `HomeScreen` | Main dashboard | Budget overview, quick actions, tips |
| `ExpensesScreen` | Transaction list | Search, filter, tabs (Latest/Needs/Wants) |
| `ChatbotScreen` | AI chat interface | Streaming responses, widgets, history |
| `ProfileScreen` | User settings | Edit profile, retake onboarding, logout |
| `SavingsScreen` | Savings goals | Create goals, track progress |
| `AddTransactionScreen` | Add expense | Manual entry, receipt scan |
| `AddMoneyScreen` | Add income | Income tracking |
| `LoginScreen` | Authentication | Email/password, Google sign-in |
| `SignUpScreen` | Registration | New user signup |
| `OnboardingScreen` | Initial setup | Profile questions, 50/30/20 intro |
| `SavedAdviceScreen` | Saved chat advice | Knowledge base from chatbot |

### Components

| Component | Purpose |
|-----------|---------|
| `SmartWidget` | Renders AI-generated widgets based on type |
| `DonutChart` | Interactive budget pie chart |
| `MessageModal` | Toast notifications |
| `EditProfileModal` | Edit user profile form |
| `AvatarPickerModal` | Select/change avatar |
| `InitialBalanceModal` | Set starting balance |
| `BalanceAllocationModal` | Month-end carry-over options |

### Widgets

| Widget | Type Code | Description |
|--------|-----------|-------------|
| `SpendingSummaryWidget` | `s` | Category breakdown with percentages |
| `ItineraryWidget` | `i` | Timeline with cost estimates |
| `GoalProgressWidget` | `g` | Progress bar for savings goals |
| `DailyTransactionsWidget` | `d` | Date-specific transaction card |

---

## 💡 Core Concepts

### 50/30/20 Budget Rule

Beruang uses the **50/30/20 budgeting rule** as its core philosophy:

| Category | Percentage | Description | Examples |
|----------|------------|-------------|----------|
| **Needs** | 50% | Essential expenses | Rent, utilities, groceries, transport |
| **Wants** | 30% | Lifestyle spending | Entertainment, dining out, hobbies |
| **Savings** | 20% | Future-focused | Emergency fund, investments, goals |

### Transaction Categories

Each transaction is classified into a **main category** and **subcategory**:

**Needs (Essential)**
- Food & Beverage
- Transportation
- Housing
- Utilities
- Healthcare
- Education

**Wants (Lifestyle)**
- Entertainment
- Shopping
- Travel
- Personal Care
- Subscriptions

**Savings/Debt**
- Emergency Fund
- Investments
- Debt Repayment
- Goals

### ⚖️ Budget Rebalancing & Rollover

Beruang features a sophisticated **mission-based** management system:

1.  **Needs Overflow**: If you exceed your 50% Needs budget, Beruang alerts you. It doesn't lock you out, but your XP progress slows down.
2.  **The 20% Mission**: Every month, you have a mandatory 20% savings target. You must manually "Add to Savings" to clear this mission.
3.  **Leftover Rollover**: Any money not spent or saved by the end of the month becomes a **Leftover Goal**. 
    - This creates a "debt to yourself" that must be cleared in the following month.
    - You can **Move to Budget** (if you're short on cash) or **Direct Withdraw** (emergency exit).
4.  **Initial Balance**: User starts with a core wallet balance that acts as the initial "seed" for the budget.

---

## 🤖 AI Integration

### Receipt Scanning

Powered by **Google Gemini 2.5 Flash**:

1. User captures receipt photo
2. Image encoded to Base64
3. Sent to Gemini Vision API
4. AI extracts: Amount, Merchant, Description, Date
5. Response parsed and displayed for confirmation

**Example API Call:**
```javascript
const response = await axios.post(GEMINI_URL, {
  contents: [{
    parts: [
      { text: "Extract receipt details as JSON..." },
      { inlineData: { mimeType: "image/jpeg", data: base64Image } }
    ]
  }]
});
```

### Transaction Classification

Powered by **TensorFlow.js**:

- Model trained on 5000+ Malaysian transactions
- Dual-output: Category + Subcategory
- 99%+ accuracy on common transactions
- Runs locally on device for privacy

**Classification Pipeline:**
```
Input: "Grab to KLCC"
  ↓
Preprocessing (tokenize, pad)
  ↓
TensorFlow Model
  ↓
Output: { category: "needs", subcategory: "Transportation", confidence: 0.98 }
```

### Intelligent Chatbot

Powered by **Grok 4.1 Fast** (via OpenRouter):

**Features:**
- Real-time streaming via Server-Sent Events (SSE)
- Context-aware responses (knows your budget, transactions, profile)
- RAG integration with:
  - Expert financial tips (388 tips)
  - Malaysian statistics (DOSM data)
  - App manual (28 topics)
- Smart widget generation

**Context Injection:**
```javascript
const augmentedPrompt = [
  userMessage,
  userProfileContext,
  budgetContext,
  transactionContext,
  expertTipsContext,
  malaysianStatisticsContext
].join('\n\n');
```

### Smart Widgets

The chatbot can generate interactive widgets by embedding JSON in `[WIDGET_DATA]` blocks:

```
Here's your spending breakdown:

[WIDGET_DATA]
{"t":"s","d":[{"c":"Food","a":200},{"c":"Transport","a":100}],"p":85}
[/WIDGET_DATA]

You've used 85% of your budget this month.
```

---

## 📡 API Reference

### Base URL
```
Production: https://your-domain.com
Development: http://localhost:3000
```

### REST Endpoints

#### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "ok",
  "services": {
    "ai": "ready",
    "grok": "configured"
  }
}
```

#### Predict Transaction Category
```http
POST /predict-transaction
Content-Type: application/json

{
  "description": "Grab to KLCC"
}
```
Response:
```json
{
  "category": "needs",
  "subcategory": "Transportation",
  "confidence": {
    "category": "99.50%",
    "subcategory": "98.20%"
  }
}
```

#### Scan Receipt
```http
POST /scan-receipt
Content-Type: application/json

{
  "image": "base64_encoded_image..."
}
```
Response:
```json
{
  "amount": 12.50,
  "merchant": "Ayam Gepuk Pak Gembus",
  "description": "Ayam Gepuk Meal",
  "date": "2026-01-03",
  "category": "needs",
  "subcategory": "Food & Beverage"
}
```

### Streaming Endpoints

#### Chat (Streaming)
```http
POST /chat/stream
Content-Type: application/json
Accept: text/event-stream

{
  "message": "What did I spend yesterday?",
  "history": [...],
  "transactions": [...],
  "userProfile": {...},
  "budgetContext": "..."
}
```
Response (SSE):
```
event: thinking
data: {"message": "Processing your request..."}

event: token
data: {"content": "Yesterday", "done": false}

event: token
data: {"content": " you", "done": false}

event: done
data: {}
```

---

## 🔥 Firebase Configuration

### Authentication

Beruang uses Firebase Authentication with:
- Email/Password login
- Google Sign-In
- Persistent sessions with `@react-native-async-storage`

### Firestore Schema

```
users/
├── {userId}/
│   ├── name: string
│   ├── email: string
│   ├── age: number
│   ├── state: string
│   ├── occupation: string
│   ├── monthlyIncome: number
│   ├── financialGoals: string
│   ├── financialSituation: string
│   ├── riskTolerance: string
│   ├── cashFlow: string
│   ├── totalXP: number
│   ├── avatar: string
│   ├── allocatedSavingsTarget: number
│   ├── hasSetInitialBalance: boolean
│   ├── lastCheckedMonth: string
│   │
│   ├── transactions/
│   │   └── {transactionId}/
│   │       ├── name: string
│   │       ├── amount: number
│   │       ├── date: string (YYYY-MM-DD)
│   │       ├── type: "income" | "expense"
│   │       ├── category: "needs" | "wants" | "savings" | "income"
│   │       ├── subCategory: string
│   │       ├── icon: string
│   │       └── createdAt: timestamp
│   │
│   ├── chatSessions/
│   │   └── {sessionId}/
│   │       ├── title: string
│   │       ├── lastMessage: string
│   │       ├── createdAt: timestamp
│   │       │
│   │       └── messages/
│   │           └── {messageId}/
│   │               ├── text: string
│   │               ├── sender: "user" | "bot"
│   │               └── createdAt: timestamp
│   │
│   ├── savedAdvices/
│   │   └── {adviceId}/
│   │       ├── text: string
│   │       ├── date: string
│   │       ├── chatId: string
│   │       └── messageId: string
│   │
│   ├── savingsGoals/
│   │   └── {goalId}/
│   │       ├── name: string
│   │       ├── targetAmount: number
│   │       ├── currentAmount: number
│   │       ├── deadline: string
│   │       └── createdAt: timestamp
│   │
│   └── monthlyBudgets/
│       └── {monthKey}/
│           ├── month: string (YYYY-MM)
│           ├── income: number
│           ├── needsTarget: number
│           ├── needsSpent: number
│           ├── wantsTarget: number
│           ├── wantsSpent: number
│           └── updatedAt: timestamp
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

Test files are located in `__tests__/` directory.

### Integration Tests

*Coming soon*

### E2E Tests

*Coming soon*

---

## 🚢 Deployment

### iOS App Store

1. Update version in `package.json` and `ios/Beruang/Info.plist`
2. Archive in Xcode: Product → Archive
3. Upload to App Store Connect
4. Submit for review

### Google Play Store

1. Update version in `package.json` and `android/app/build.gradle`
2. Generate signed APK/AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
3. Upload to Google Play Console
4. Submit for review

### Backend Deployment

The backend can be deployed to:
- **Render**: Free tier available
- **Railway**: Easy Node.js deployment
- **Fly.io**: Global edge deployment
- **Your own VPS**: Docker container available

---

## ⚡ Performance Optimization

### Frontend Optimizations

- **Memoization**: `React.memo()` on expensive components
- **Virtualized Lists**: `FlatList` for long transaction lists
- **Image Optimization**: Compressed assets
- **Bundle Splitting**: Metro bundler optimization

### Backend Optimizations

- **Connection Pooling**: HTTP Keep-Alive connections
- **Parallel Processing**: 5-way concurrent AI calls
- **Response Caching**: Local response templates
- **Streaming**: SSE for real-time chat
- **Model Warmup**: Pre-load AI models on startup

---

## ❓ Troubleshooting

### Common Issues

#### Metro bundler not starting
```bash
npx react-native start --reset-cache
```

#### iOS build fails
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
npm run ios
```

#### Android build fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### Firebase connection issues
- Check `firebaseConfig.js` is correct
- Ensure Firebase project has Firestore enabled
- Check authentication methods are enabled

### FAQ

**Q: Why is the chatbot slow?**
A: The AI response is streaming in real-time from the cloud. Check your internet connection.

**Q: How do I reset my data?**
A: Go to Profile → Delete Account, or contact support.

**Q: Can I use offline?**
A: Basic features work offline. AI features require internet.

---

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Core budgeting with 50/30/20
- ✅ AI chatbot with streaming
- ✅ Receipt scanning
- ✅ Gamification (XP & levels)
- ✅ Smart widgets

### v1.1 (Planned)
- [ ] Bank account integration
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Export to CSV/PDF

### v1.2 (Future)
- [ ] Multi-currency support
- [ ] Family budgets
- [ ] Investment tracking
- [ ] Desktop web app

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use TypeScript
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/) - Mobile framework
- [Firebase](https://firebase.google.com/) - Backend services
- [OpenRouter](https://openrouter.ai/) - AI API gateway
- [Google Gemini](https://ai.google.dev/) - Vision AI
- [TensorFlow.js](https://www.tensorflow.org/js) - On-device ML
- [Feather Icons](https://feathericons.com/) - Icon set

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/izwanGit">Izwan</a>
</p>

<p align="center">
  <a href="#-beruang">⬆️ Back to Top</a>
</p>
