# MealMate AI — Landing Page

A premium React + Vite landing page for MealMate AI.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Framer Motion
- shadcn/ui components
- Lucide React icons
- Wouter (routing)

## Prerequisites

Make sure you have **Node.js 18+** installed.
Download from: https://nodejs.org

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server (opens at http://localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Project Structure

```
src/
├── index.css                    # Design system — colors, fonts, theme
├── main.tsx                     # Entry point
├── App.tsx                      # Router
├── pages/
│   └── Home.tsx                 # Assembles all sections
├── components/
│   ├── AnimatedSection.tsx      # Reusable scroll-animation wrapper
│   └── sections/
│       ├── Navbar.tsx
│       ├── HeroSection.tsx
│       ├── StatsSection.tsx
│       ├── FeaturesSection.tsx
│       ├── HowItWorksSection.tsx
│       ├── AIFeaturesSection.tsx
│       ├── AppPreviewSection.tsx
│       ├── TestimonialsSection.tsx
│       ├── CTASection.tsx
│       └── Footer.tsx
```

## Colors

| Token    | Hex       |
|----------|-----------|
| Primary  | #22C55E   |
| Secondary| #16A34A   |
| Accent   | #F59E0B   |
| Background| #F8FAFC  |
