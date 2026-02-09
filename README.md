# Sifat Morshed — Portfolio & Work With Me Platform

A modern, dark-themed portfolio and hiring platform built with React, TypeScript, and Vercel serverless functions. Features a complete applicant tracking system with Google Sheets integration.

**[Live Site](https://sifat-there.vercel.app/)**

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript 5, Vite 6 |
| Styling | Tailwind CSS, GSAP animations |
| Backend | Vercel Serverless Functions (Node.js) |
| Data | Google Sheets API v4 |
| Auth | Google Identity Services |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel |

## Key Features

- **Portfolio** — Sales-focused personal site with interactive components, call simulator, objection library, and KPI storyboard
- **Work With Me** — Full hiring module with role listings, application forms, file uploads (CV + audio), and real-time status tracking
- **Admin Dashboard** — Protected admin panel with full applicant management, status updates, CSV export, manual email sender, and earnings tracking
- **Email Notifications** — Automated dark-themed emails for status changes, application confirmations, and 7-day worker milestones
- **Google Sheets Backend** — All application data stored and color-coded in Google Sheets with automatic row formatting

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` for local configuration (see Vercel env vars for required keys).

## Deployment

Deployed automatically via Vercel on push to `main`. All environment variables are configured in the Vercel dashboard.

## License

All rights reserved.
