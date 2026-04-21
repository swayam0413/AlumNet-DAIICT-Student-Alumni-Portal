# AlumConnect - Dependency Requirements

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ (recommended v20+) | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ (comes with Node.js) | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/swayam0413/AlumNet-DAIICT-Student-Alumni-Portal.git
cd AlumNet-DAIICT-Student-Alumni-Portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
APP_URL=http://localhost:3000
```

> **Get your Gemini API Key:** Visit [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key.

### 4. Run the Project
```bash
npm run dev
```
The app will be available at **http://localhost:3000**

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.0.0 | Core UI framework |
| `react-dom` | ^19.0.0 | React DOM rendering |
| `react-router-dom` | ^7.14.1 | Client-side routing & navigation |
| `express` | ^4.21.2 | Backend HTTP server |
| `firebase` | ^12.12.0 | Firebase Auth & Firestore client SDK |
| `firebase-admin` | ^13.8.0 | Firebase Admin SDK (server-side user management) |
| `@google/genai` | ^1.29.0 | Google Gemini / Gemma AI integration |
| `motion` | ^12.23.24 | Framer Motion - UI animations |
| `lucide-react` | ^0.546.0 | Modern icon library |
| `react-hot-toast` | ^2.6.0 | Toast notification system |
| `dotenv` | ^17.2.3 | Environment variable management |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing middleware |
| `cookie-parser` | ^1.4.7 | Cookie parsing middleware |
| `zod` | ^4.3.6 | Schema validation library |
| `@tailwindcss/vite` | ^4.1.14 | Tailwind CSS Vite plugin |
| `@vitejs/plugin-react` | ^5.0.4 | React plugin for Vite |
| `vite` | ^6.2.0 | Frontend build tool & dev server |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.8.2 | TypeScript compiler |
| `tsx` | ^4.21.0 | Run TypeScript files directly |
| `tailwindcss` | ^4.1.14 | Utility-first CSS framework |
| `autoprefixer` | ^10.4.21 | CSS vendor prefix automation |
| `@types/express` | ^4.17.21 | TypeScript types for Express |
| `@types/node` | ^22.14.0 | TypeScript types for Node.js |
| `@firebase/eslint-plugin-security-rules` | ^0.0.1 | Firebase security rules linting |

---

## Firebase Configuration

The project uses Firebase for authentication and database. The Firebase config is located in:
- **Client:** `src/lib/firebase.ts`
- **Server:** `server.ts`

### Firebase Services Used:
| Service | Purpose |
|---------|---------|
| **Authentication** | User login/registration (Email + Password) |
| **Cloud Firestore** | Database for user profiles, jobs, events, messages |

---

## AI Integration

| Model | Used For |
|-------|----------|
| **Gemma 3 27B IT** (`gemma-3-27b-it`) | Resume parsing, career advice, referral generation |

The AI is accessed via the Google GenAI SDK through the Gemini API key.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build artifacts |

---

## Project Structure

```
alumni_connect/
├── server.ts              # Express backend + AI endpoints
├── .env                   # Environment variables (create manually)
├── package.json           # Dependencies & scripts
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── firestore.rules        # Firestore security rules
├── firebase.json          # Firebase project config
├── public/                # Static assets (images)
│   ├── login_bg.png
│   └── home_bg.png
└── src/
    ├── App.tsx            # Root component & routing
    ├── index.css          # Global styles & Tailwind
    ├── lib/
    │   └── firebase.ts    # Firebase client initialization
    ├── context/
    │   └── AuthContext.tsx # Authentication state management
    ├── services/
    │   ├── authService.ts # Auth operations
    │   ├── aiService.ts   # AI API calls
    │   └── dataService.ts # Firestore CRUD operations
    ├── screens/
    │   ├── Login.tsx      # Login & Registration
    │   ├── Home.tsx       # Dashboard
    │   ├── Profile.tsx    # User profile + AI resume parsing
    │   ├── Jobs.tsx       # Job board
    │   ├── Admin.tsx      # Admin panel
    │   ├── AIAssistant.tsx # AI career chatbot
    │   └── Messages.tsx   # Direct messaging
    └── components/
        ├── Sidebar.tsx    # Navigation sidebar
        ├── TopBar.tsx     # Top navigation bar
        ├── ChatModal.tsx  # Chat modal
        ├── NetworkingRadar.tsx # Alumni networking radar
        └── NotificationBell.tsx # Notifications
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Port 3000 already in use` | Kill existing: `taskkill /F /IM node.exe` (Windows) |
| `GEMINI_API_KEY not working` | Verify key at [AI Studio](https://aistudio.google.com/apikey) |
| `Firebase Auth error` | Check Firebase Console → Authentication is enabled |
| `Firestore permission denied` | Deploy rules: `firebase deploy --only firestore:rules` |
| `email-already-in-use on signup` | Delete stale user from Firebase Console → Authentication |
