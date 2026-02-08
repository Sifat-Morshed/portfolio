# Sifat Morshed — Professional Portfolio

High-performance sales portfolio with an integrated **Work With Me** hiring module. Built with React, TypeScript, GSAP, and Tailwind — deployed on Vercel with serverless API routes and Google Sheets as a backend.

**[View Live →](https://sifat-there.vercel.app/)**

---

## Overview

### Main Portfolio
- **Sales Playbook** — Objection library with proven closing techniques
- **KPI Dashboard** — Real-time performance metrics and analytics
- **Call Simulator** — Interactive training for call scenarios
- **Career Timeline** — Professional progression milestones
- **Performance Analytics** — Call metrics and conversion breakdown

### Work With Me Module
A full hiring pipeline built into the portfolio:

- **Public Job Listings** at `/work` — Two roles (Global Setter, Bosnia Specialist)
- **Application Flow** — 4-step modal: Google Sign-In → Identity + Nationality → Compliance Agreement → Audio Upload
- **Audio Assessment** — 30–60s recording (self-intro + cold-call roleplay)
- **Blacklist Compliance** — Mandatory 1–2 week commitment acknowledgment
- **Timezone Converter** — Auto-detects visitor timezone, converts UK shift hours
- **Status Tracking** at `/work/status` — Applicants check progress by Application ID
- **Admin Dashboard** at `/work/admin` — Filter by role/status, inline audio playback, status updates, CSV export
- **Google Sheets Backend** — All application data stored in a 16-column spreadsheet
- **Google Drive Storage** — CV and audio files uploaded to Drive
- **Email Notifications** — Confirmation emails via Gmail SMTP

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 18, TypeScript, Vite 6.4 |
| **Styling** | Tailwind CSS (CDN), custom dark theme |
| **Animations** | GSAP 3.14 + ScrollTrigger, Lenis smooth scroll |
| **Auth** | Google Identity Services (OAuth 2.0) |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **Database** | Google Sheets API v4 |
| **Storage** | Google Drive API v3 |
| **Email** | Nodemailer + Gmail App Password |
| **Deployment** | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Google Cloud project with OAuth + Service Account (for production)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Access at `http://localhost:3000`

> **Dev Mode**: When `VITE_GOOGLE_CLIENT_ID` is not set, the Work module shows dev-mode buttons for testing the UI without real Google auth. Mock data is provided for the admin dashboard.

### Production Build

```bash
npm run build
```

---

## Environment Variables

Create a `.env.local` file (never committed):

```env
# Google OAuth (for Sign-In button)
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id

# Admin email
VITE_ADMIN_EMAIL=your-email@gmail.com

# Google Service Account (server-side, set in Vercel dashboard)
GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id

# Admin verification (server-side)
ADMIN_EMAIL=your-email@gmail.com

# Email notifications (server-side)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

---

## Project Structure

```
├── components/
│   ├── Hero.tsx, About.tsx, Services.tsx ...    # Main portfolio
│   ├── ui/                                      # Reusable UI
│   └── work/                                    # Work With Me module
│       ├── WorkListing.tsx      # Job listings + timezone converter
│       ├── ProjectLanding.tsx   # Role detail page
│       ├── ApplicationModal.tsx # 4-step application flow
│       ├── AudioUploader.tsx    # Audio file upload (30-60s)
│       ├── StatusPage.tsx       # Applicant status checker
│       ├── StatusTimeline.tsx   # Visual status progress
│       ├── AdminLogin.tsx       # Admin authentication
│       ├── AdminDashboard.tsx   # Admin panel
│       ├── AdminTable.tsx       # Applications data table
│       ├── WorkCTA.tsx          # Homepage CTA section
│       └── WorkLayout.tsx       # Work module shell/nav
├── src/
│   ├── App.tsx                  # Routes & page composition
│   ├── lib/work/
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── opportunities.ts     # Company & role data
│   │   ├── AuthContext.tsx       # Google auth provider
│   │   ├── countries.ts         # Nationality dropdown data
│   │   ├── google-sheets.ts     # Sheets API adapter
│   │   └── google-drive.ts      # Drive API adapter
│   └── index.tsx                # Entry point
├── api/                         # Vercel serverless functions
│   ├── work/submit.ts           # POST: application submission
│   ├── work/status.ts           # GET: check application status
│   └── work/admin/
│       ├── list.ts              # GET: all applications (admin)
│       ├── update.ts            # PATCH: update status (admin)
│       └── export.ts            # GET: CSV export (admin)
├── vercel.json                  # Vercel deployment config
├── .env.example                 # Environment template
└── .gitignore
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set all environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Vite + serverless functions

### Google Sheets Setup
1. Create a Google Sheet with a tab named **"Applications"**
2. Add header row: `app_id | timestamp | status | company_id | role_id | role_title | full_name | email | phone | nationality | reference | blacklist_acknowledged | cv_link | audio_link | notes | last_updated`
3. Share the sheet with your service account email (Editor access)

### Google Drive Setup
1. Create a folder in Google Drive for uploads
2. Share folder with service account email (Editor access)
3. Copy the folder ID to `GOOGLE_DRIVE_FOLDER_ID`

---

## Application Statuses

| Status | Meaning |
|--------|---------|
| `NEW` | Application received, pending review |
| `AUDIO_PASS` | Audio assessment approved |
| `INTERVIEW` | Scheduled for interview |
| `HIRED` | Successfully hired |
| `REJECTED` | Application declined |

---

## Performance

- **Build Time**: ~3.4s
- **Bundle**: ~59 KB gzipped (main)
- **Modules**: 1,758 optimized
- **Animations**: 60fps GSAP + ScrollTrigger
- **Responsive**: Mobile, tablet, desktop

---

## Browser Support

Chrome, Firefox, Safari, Edge (latest versions)

---

## License

All rights reserved.

**Built for Sales Professionals | Crafted with Precision | Optimized for Performance**
