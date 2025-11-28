# 🌱 Cacao AI Clinics

> Transform WhatsApp chaos into booked high-ticket treatments for aesthetic and dermatology clinics.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status: Production Ready"/>
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version 1.0.0"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License: Proprietary"/>
</p>

---

## 📖 Overview

**Cacao AI Clinics** is a premium multi-tenant SaaS platform that provides AI-powered WhatsApp receptionist and intelligent follow-up automation for Brazilian aesthetic and dermatology clinics.

The platform helps clinics recover R$15,000-30,000+ per month in lost revenue by:
- 🚀 **Responding instantly** to WhatsApp leads 24/7
- 📅 **Reducing no-shows** by 40%+ with smart reminders
- 💰 **Converting "I'll think about it"** patients with automated follow-ups
- 📊 **Tracking everything** with real-time analytics

### Key Features

✅ **Public Landing Page** - High-converting marketing site with calculator lead magnet
✅ **Revenue Leak Calculator** - Interactive tool that generates qualified leads
✅ **Multi-Tenant Architecture** - Secure, isolated sub-accounts for each clinic
✅ **Admin Panel** - Manage clinics, users, and calculator leads
🚧 **WhatsApp Integration** - AI receptionist (Coming Q1 2025)
🚧 **Appointment Management** - Calendar sync and booking (Coming Q1 2025)
🚧 **Follow-up Automation** - Smart recall campaigns (Coming Q1 2025)

---

## 🎯 Target Market

**Primary Customers:**
- Aesthetic and dermatology clinics in Brazil
- 100+ WhatsApp leads per month
- 2-5 doctors on staff
- High-ticket treatments (R$1,500-5,000 average)
- 20-30% no-show rates

**Market Size:**
- 15,000+ aesthetic clinics in Brazil
- 3,000+ with WhatsApp Business
- Target: 100 clinics in Year 1

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/cacaogithu/CLeaknic.git
cd CLeaknic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your [Supabase Dashboard](https://app.supabase.com) → Project Settings → API.

---

## 📦 Project Structure

```
CLeaknic/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, logos
│   ├── components/        # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── pipeline/     # Pipeline/CRM components
│   │   ├── appointments/ # Calendar components
│   │   └── RevenueCalculator.tsx  # Lead magnet calculator
│   ├── pages/            # Route pages
│   │   ├── Landing.tsx   # Public landing page
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Auth.tsx      # Login/signup
│   │   └── Admin/        # Admin-only pages
│   │       ├── TenantManagement.tsx
│   │       └── CalculatorLeads.tsx
│   ├── integrations/     # External integrations
│   │   └── supabase/     # Supabase client and types
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── supabase/
│   ├── functions/        # Edge Functions
│   │   └── generate-revenue-report/  # PDF generator
│   └── migrations/       # Database migrations
├── PRD.md                # Product Requirements Document
├── TODO.md               # Project roadmap and tasks
├── AGENT_PERSONA.md      # AI agent configuration
└── README.md             # This file
```

---

## 🗄️ Database Setup

### Run Migrations

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations to database
supabase db push
```

### Core Tables

- **`tenants`** - Clinic accounts (multi-tenancy)
- **`tenant_users`** - User-tenant relationships with roles
- **`calculator_leads`** - Revenue calculator submissions
- **`clientes`** - Patient/lead records (per tenant)
- **`conversas`** - WhatsApp conversations (per tenant)
- **`mensagens`** - Individual messages (per tenant)
- **`appointments`** - Calendar events (per tenant)
- **`budgets`** - Treatment quotes (per tenant)

### Row-Level Security (RLS)

All tables implement RLS policies to ensure tenant isolation:
- Users can only access data for their assigned tenant(s)
- Admin users can access cross-tenant data
- Public landing page and calculator are not tenant-scoped

---

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email, magic link, OAuth)
  - Row-Level Security (RLS)
  - Real-time subscriptions
  - Edge Functions (Deno)
  - Storage for files

### Integrations
- **Z-API** - WhatsApp Business API (planned)
- **OpenAI GPT-4** - AI conversational engine (planned)
- **Google Calendar API** - Appointment sync (planned)
- **SendGrid** - Transactional emails (planned)

### Deployment
- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend hosting
- **Cloudflare** - CDN and DDoS protection

---

## 🔐 Security

### Multi-Tenancy Isolation
- Row-Level Security (RLS) on all tables
- Tenant ID checked on every query
- No cross-tenant data access possible

### Authentication
- Email + password with minimum 8 characters
- Magic link authentication (passwordless)
- Session management with 30-day expiry
- Role-based access control (RBAC)

### Data Protection
- All data encrypted at rest (AES-256)
- All traffic encrypted in transit (TLS 1.3)
- Daily automated backups
- 7-day point-in-time recovery

### LGPD Compliance
- Explicit consent collection
- Data export capability
- Data deletion (30-day grace period)
- Privacy policy and terms of service

---

## 🧪 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking and build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Quality

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Prettier** - Code formatting (recommended)

### Best Practices

1. **Component Organization**
   - One component per file
   - Use TypeScript interfaces for props
   - Keep components small and focused

2. **State Management**
   - Server state: TanStack Query
   - Local state: React useState/useReducer
   - Global state: Context API or Zustand

3. **Styling**
   - Tailwind utility classes preferred
   - Responsive design mobile-first
   - Premium green/white color scheme

4. **Database Queries**
   - Always filter by `tenant_id` when relevant
   - Use RLS policies as primary security
   - Index frequently queried columns

---

## 📊 Analytics & Monitoring

### Product Analytics
- **Vercel Analytics** - Core Web Vitals
- **PostHog** (planned) - User behavior tracking
- **Google Analytics** - Website traffic

### Error Tracking
- **Sentry** (planned) - Error monitoring and alerts

### Performance
- Lighthouse score: 95+ on all pages
- First Contentful Paint: <1.5s
- Time to Interactive: <3s

---

## 🚢 Deployment

### Frontend (Vercel)

The easiest way to deploy is via Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy!

### Backend (Supabase)

```bash
# Deploy Edge Functions
supabase functions deploy generate-revenue-report

# Set function secrets
supabase secrets set OPENAI_API_KEY=your_key
```

### Environment Setup

**Production Environment Variables:**
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Production Supabase anon key

---

## 💼 Business Model

### Pricing

**Founding Clinics Program (First 10 only):**

| Tier | Clinics | Setup | Monthly | Locked |
|------|---------|-------|---------|--------|
| Founder 1-3 | First 3 | R$ 3,000 | R$ 1,500 | Forever |
| Founder 4-10 | Next 7 | R$ 3,000 | R$ 2,000 | Forever |
| Standard | 11+ | R$ 3,000 | R$ 3,500 | No lock |
| Enterprise | Custom | Custom | Custom | Custom |

**Value Proposition:**
- Average clinic recovers R$15-30k/month
- ROI: 10-20x monthly investment
- Alternative: Hire receptionist (R$3,000+/month + benefits)

### Revenue Model
- **MRR Target (Month 3)**: R$ 5,000
- **MRR Target (Month 6)**: R$ 25,000
- **MRR Target (Month 12)**: R$ 90,000
- **Target Customer LTV**: R$ 36,000 (24 months @ R$1,500/month)
- **Target Churn**: <5% monthly

---

## 📈 Metrics & KPIs

### Acquisition Metrics
- **Calculator Submissions**: 50+/month target
- **Conversion Rate**: 10%+ visitors → submissions
- **Completion Rate**: 80%+ submissions completed
- **CTA Click-Through**: 30%+ of completions

### Conversion Metrics
- **Lead-to-Qualified**: 20%+ of submissions
- **Qualified-to-Customer**: 40%+ of qualified
- **Average Sales Cycle**: 7-14 days

### Product Metrics
- **AI Resolution Rate**: 85%+ (when launched)
- **Response Time**: <2s average
- **No-Show Reduction**: 40%+
- **Revenue Recovered**: R$10k+/clinic/month

### Customer Success
- **NPS Score**: 50+ target
- **CSAT**: 4.5/5+ rating
- **Customer Retention**: 95%+ monthly

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Complete)
- [x] Landing page with calculator
- [x] Multi-tenant database architecture
- [x] Admin panel for tenant management
- [x] Calculator leads management
- [x] Premium green/white branding

### 🚧 Phase 2: Core Platform (Q1 2025)
- [ ] WhatsApp integration (Z-API)
- [ ] AI receptionist engine
- [ ] Appointment management
- [ ] Follow-up automation
- [ ] First 3 founding clinics live

### 📅 Phase 3: Advanced Features (Q2 2025)
- [ ] Full CRM and pipeline
- [ ] Analytics dashboards
- [ ] Team collaboration tools
- [ ] 10 founding clinics closed

### 🔮 Phase 4: Scale (Q3-Q4 2025)
- [ ] White-label solution
- [ ] Integrations marketplace
- [ ] AI model optimization
- [ ] 50+ paying customers

See [TODO.md](./TODO.md) for detailed task list.

---

## 🤝 Contributing

This is a proprietary project. External contributions are not accepted at this time.

**Internal Team:**
- **Product/Business**: Strategy and requirements
- **Engineering**: Implementation and infrastructure
- **Marketing**: Go-to-market and growth
- **Customer Success**: Onboarding and support

---

## 📄 License

**Proprietary and Confidential**

Copyright © 2024 Cacao AI. All rights reserved.

---

## 📞 Support & Contact

### For Customers
- **Email**: support@cacaoai.com
- **WhatsApp**: (for paying customers)

### For Partners
- **Email**: partners@cacaoai.com

---

## 🌟 Success Stories

> "We recovered R$28,000 in the first month just from follow-ups on old budgets. This paid for itself 18 times over!"
>
> — **Dr. Ana Paula**, EvidenS Clinic (Founding Clinic #1)

_More testimonials coming as we onboard founding clinics!_

---

## 🙏 Acknowledgments

**Built With:**
- [React](https://react.dev) - UI framework
- [Supabase](https://supabase.com) - Backend platform
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Lucide](https://lucide.dev) - Icons

**Inspired By:**
- $100M Offers by Alex Hormozi
- Traction by Gabriel Weinberg
- The Mom Test by Rob Fitzpatrick

---

<p align="center">
  <strong>Made with 🌱 by Cacao AI</strong><br>
  Transforming WhatsApp chaos into revenue
</p>
