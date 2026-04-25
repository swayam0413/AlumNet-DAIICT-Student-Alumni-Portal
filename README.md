# AlumNet - DA-IICT Student Alumni Portal

AlumNet is a student-alumni networking platform for the DA-IICT community. It helps students discover alumni, request referrals, explore job opportunities, attend events, chat with members, and get AI-assisted career guidance.

## Features

- Student, alumni, and admin authentication with Firebase Auth
- Protected dashboard for approved users
- Alumni directory with role, company, and batch filters
- Profile pages for students and alumni
- Personalized alumni recommendations based on department, batch, and shared skills
- Job board where alumni/admins can post opportunities
- Referral request generator powered by Gemini
- AI career assistant for resume, interview, networking, and career advice
- Resume parsing support for extracting skills, experience, projects, and profile summaries
- Networking radar that highlights relevant alumni activity and trends
- Direct messaging between users
- Event creation and approval workflow
- Admin console for user approvals, job moderation, event moderation, and platform stats
- Firestore security rules for role-based access control

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, custom CSS tokens |
| Routing | React Router |
| Animation | Motion |
| Icons | Lucide React |
| Backend | Express server with Vite middleware, python |
| Database/Auth | Firebase Auth, Cloud Firestore |
| AI | Google Gemini via `@google/genai` |
| Tooling | TypeScript, ESLint, Firebase rules |

## Project Structure

```text
.
|-- public/                 # Static images and public assets
|-- pyhton_backend/
|-- src/
|   |-- components/         # Shared UI components and modals
|   |-- context/            # Auth context and role helpers
|   |-- lib/                # Firebase initialization
|   |-- screens/            # Main app pages
|   `-- services/           # Auth, data, and AI service wrappers
|-- server.ts               # Express API server and Vite dev middleware
|-- firestore.rules         # Firestore security rules
|-- firebase.json           # Firebase configuration
|-- security_spec.md        # Security invariants and rejection targets
|-- package.json            # Scripts and dependencies
`-- vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Firebase project with Authentication and Firestore enabled
- Google Gemini API key

### Clone setup

1. Clone the repository:

```bash
git clone https://github.com/swayam0413/AlumNet-DAIICT-Student-Alumni-Portal.git
cd AlumNet-DAIICT-Student-Alumni-Portal



```
### Local Installation

1. Open a terminal in `........`
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root and add:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

## Environment Variables

- `GEMINI_API_KEY` - required for AI endpoints using Gemini
- `PORT` - optional port for the Express/Vite server

## Running the Optional Python Backend

The Python backend provides mirrored AI endpoints plus extra ML recommendation and LangChain resume parsing capabilities.

1. Change to the `python_backend` folder:
   ```bash
   cd python_backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python main.py
   ```
4. The backend should be available at `http://localhost:8000`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | API key used by the Express server for Gemini-powered features |
| `PORT` | No | Local server port. Defaults to `3000` |

## Firebase Setup

1. Enable Email/Password sign-in in Firebase Authentication.
2. Create a Cloud Firestore database.
3. Add your Firebase web app config to [`src/lib/firebase.ts`](src/lib/firebase.ts).
4. Deploy or test Firestore rules from [`firestore.rules`](firestore.rules).

Useful Firebase collections used by the app:

- `users`
- `jobs`
- `events`
- `connections`
- `conversations`
- `notifications`
- `networking_events`
- `mentorships`

## Main Pages

- `/login` - user login and signup
- `/` - dashboard with stats, recommendations, events, and networking radar
- `/jobs` - job board and referral flow
- `/ai-assistant` - Gemini-powered career assistant
- `/profile` and `/profile/:id` - profile management and public profiles
- `/messages` - direct messaging
- `/settings` - account settings
- `/admin` - admin dashboard and moderation tools

## AI Features

The Express server exposes AI endpoints under `/api/ai`:

- `POST /api/ai/parse-resume`
- `POST /api/ai/career-advice`
- `POST /api/ai/generate-referral`
- `POST /api/ai/networking-radar`

These endpoints require `GEMINI_API_KEY` to be configured in `.env`.

## Security Notes

- Do not commit `.env` or private API keys.
- Firestore access is controlled through [`firestore.rules`](firestore.rules).
- Admin access should be granted carefully and should not be self-assignable.
- Review [`security_spec.md`](security_spec.md) for the main security invariants.

## Deployment

Build the app with:

```bash
npm run build
```

The frontend build output is generated in `dist/`. If deploying the full app with AI API routes, deploy the Express server as well, because Gemini-powered features depend on `server.ts`.

## Repository

GitHub: [swayam0413/AlumNet-DAIICT-Student-Alumni-Portal](https://github.com/swayam0413/AlumNet-DAIICT-Student-Alumni-Portal)
