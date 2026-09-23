# lamviec360_company_web# LàmViệc360 - Company & Employer Portal (`new-company-web`)

Dedicated Next.js 15 web application for Employers, Recruiters, and Hiring Managers.

---

## 🚀 Key Features

- **Employer Landing**: Value propositions, recruitment solutions, pricing tiers, and hiring guides.
- **Authentication**: Company registration, recruiter login, email verification, and team invitation activation.
- **Company Workspace Dashboard**: Real-time hiring KPIs, candidate pipeline stage overview, and active job tracking.
- **Job Management**: Create, edit, and toggle job postings (active, closed, draft).
- **ATS Candidate Review**: Interactive hiring pipeline (Applied → Reviewing → Shortlisted → Interview → Offer/Rejected), candidate rating, recruiter notes, and resume viewer.
- **Team Management**: Invite team members and manage role-based permissions (Admin, Recruiter, Hiring Manager).
- **Subscription & Billing**: Plan selection, usage metrics, and invoices.
- **Settings & Branding**: Company profile, logo, banner, address, industry, and social links.
- **Pure Web App**: PWA service workers and install manifests completely removed.

---

## ⚙️ Configuration

- **Dev Port**: `3002` (configured in `package.json` and `.env.local`).
- **Backend API Gateway**: Connects to Company Gateway (`http://localhost:8002/api/v1/company`).
- **Design System**: Built with Tailwind CSS v4 and LàmViệc360 design tokens.

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3002](http://localhost:3002) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```
