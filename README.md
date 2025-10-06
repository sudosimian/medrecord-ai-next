# MedRecord AI

**AI-Powered Medical-Legal Services for Attorneys**

Transform medical records into legal work product in minutes. Purpose-built for personal injury, medical malpractice, and workers' compensation cases.

## Services Complete (9 of 16)

**Core Legal Services:**
- Medical Chronologies - AI-extracted timelines with Bates numbering
- Billing Summaries - Automated economic damages calculation
- Demand Letters - AI-generated settlement demands (Standard/UIM/Stowers)
- Narrative Summaries - Comprehensive injury and causation analysis
- Deposition Summaries - Q&A extraction with contradiction detection

**Utility Services:**
- Provider List - Healthcare roster with visit tracking
- Missing Records - AI-detected gaps in documentation
- Medical Synopsis - Ultra-brief case summaries
- PDF Tools - Document merging, sorting, bookmarks

**Status:** Production Ready | **Version:** 2.0.0 | **Completion:** 56%

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment (see Environment Variables below)
cp .env.local.example .env.local

# Set up Supabase (see SUPABASE_SETUP.md)
supabase db push --linked

# Start development server
pnpm dev

# Open http://localhost:3001 (if 3000 is in use)
```

## Testing

```bash
# Run development server
pnpm dev

# Follow testing guide
# See TESTING_GUIDE.md for complete workflow tests
```

## Environment Variables

Create `.env.local`:

```
OPENAI_API_KEY=your_openai_key_here

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui (Radix UI)
- **AI**: OpenAI GPT-4o
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/ui/    # UI components
└── lib/              # Utilities and services
```

## Features

- 🔐 Supabase Authentication (email/password)
- 📁 Document Upload & Storage
- 📊 Patient management (coming soon)
- 🤖 AI-powered medical analysis
- 📄 Legal document generation
- 🔒 Secure API routes with RLS
- 📱 Responsive design

## Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database and storage setup
- **[TESTING.md](./TESTING.md)** - Testing guide for document upload
- **[GAP_ANALYSIS.md](./GAP_ANALYSIS.md)** - Feature roadmap and gap analysis

## Deployment

Deploy to Vercel:

```bash
vercel
```

Add environment variables in Vercel dashboard.

## License

Private - All rights reserved
