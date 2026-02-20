# 🌟 Couple's To-Do App - Complete Technical Documentation
## *Your Wife's Ultimate Productivity Companion - Built with Love*

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision & Goals](#project-vision--goals)
3. [Technical Architecture](#technical-architecture)
4. [Design System](#design-system)
5. [Core Features](#core-features)
6. [AI Integration Strategy](#ai-integration-strategy)
7. [Gamification & Engagement](#gamification--engagement)
8. [Database Schema](#database-schema)
9. [User Experience Flow](#user-experience-flow)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Deployment Strategy](#deployment-strategy)
12. [Future Enhancements](#future-enhancements)

---

## 🎯 Executive Summary

### Project Name
**"Together Tasks"** (or choose your own name)

### Mission Statement
Create a zero-cost, premium-quality to-do application that makes productivity feel like a reward, specifically designed to help your wife manage her demanding schedule as a student and full-time worker, while maintaining couple connectivity and making task management genuinely enjoyable.

### Core Value Proposition
- **Lightning-fast task capture** - Add tasks in under 3 seconds
- **AI-powered intelligence** - Free, unlimited AI assistance that feels personal
- **Dopamine-driven design** - Every interaction feels rewarding
- **Couple synchronization** - Shared productivity journey with personalized spaces
- **Native app experience** - PWA that feels indistinguishable from a native app
- **Zero cost forever** - Built entirely on free-tier services

### Success Metrics
- Daily active usage by your wife
- Task completion rate increase
- Reduction in stress indicators
- Voluntary engagement (opens app without prompting)
- Positive emotional response to app interactions

---

## 🎨 Project Vision & Goals

### Primary Objectives

1. **Reduce Cognitive Load**
   - Make task entry so fast it becomes second nature
   - Automatic organization and prioritization
   - Visual clarity that prevents overwhelm

2. **Increase Engagement**
   - Gamification that triggers dopamine release
   - Beautiful aesthetics that compete with social media
   - Celebrations that feel genuine and earned

3. **Maintain Couple Connection**
   - Shared task visibility for mutual support
   - Ability to add tasks to each other's lists
   - Special badges and couple-specific features

4. **Smart Assistance**
   - AI that understands context (work, school, home)
   - Proactive suggestions and task breakdown
   - Personalized notifications that sound like you

### Design Philosophy

**Apple-Level Polish**
- Every pixel matters
- Animations have purpose
- Micro-interactions delight
- Performance is non-negotiable
- Accessibility is built-in

**Gamification with Substance**
- Celebrations tied to real accomplishments
- Progressive complexity (simple start, deep features)
- Intrinsic motivation over arbitrary points
- Social connection (couple features) as motivation

**AI as a Caring Partner**
- Understands user context and state
- Provides encouragement without being annoying
- Learns preferences over time
- Feels like your presence in the app

---

## 🏗️ Technical Architecture

### Technology Stack (Advanced, Zero-Cost)

#### Frontend Framework
**Next.js 14+ (App Router)**
- React Server Components for performance
- TypeScript for type safety and developer experience
- Incremental Static Regeneration for speed
- API routes for backend logic

**Why this choice:**
- Best-in-class performance
- SEO capabilities (if you want to share publicly later)
- Server components reduce client-side JavaScript
- Vercel deployment is seamless and free

#### UI Framework & Styling
**Tailwind CSS + shadcn/ui + Framer Motion**

**Tailwind CSS:**
- Utility-first approach for rapid development
- Custom design system configuration
- Responsive design out of the box
- PurgeCSS for minimal bundle size

**shadcn/ui:**
- Accessible components by default
- Radix UI primitives underneath
- Copy-paste components (not npm package bloat)
- Fully customizable with Tailwind

**Framer Motion:**
- Production-ready animations
- Gesture support
- Layout animations
- Scroll-triggered animations
- Spring physics for natural movement

#### State Management
**Zustand + React Query (TanStack Query)**

**Zustand:**
- Minimal boilerplate
- TypeScript support
- Devtools integration
- Perfect for global UI state

**React Query:**
- Server state management
- Automatic refetching
- Optimistic updates
- Cache management
- Real-time subscriptions

#### Backend & Database
**Supabase (PostgreSQL)**

**Free Tier Includes:**
- 500MB database space (more than enough)
- Unlimited API requests
- Real-time subscriptions
- Row Level Security (RLS)
- Authentication built-in
- Storage for attachments (1GB)

**Why Supabase:**
- PostgreSQL is production-grade
- Real-time updates for couple sync
- Built-in auth with social providers
- Generous free tier
- Edge functions for serverless logic

#### AI Integration
**DeepSeek API (Free Forever)**

**Capabilities:**
- Natural language understanding
- Task breakdown and suggestions
- Personalized notifications
- Context awareness
- Unlimited free usage

**Fallback/Alternative:**
- Together AI (free tier)
- Groq (fast inference, free tier)
- Hugging Face Inference API

#### PWA & Offline Support
**Next-PWA + Workbox**

**Features:**
- Install prompt
- Offline functionality
- Background sync
- Push notifications
- App-like experience
- No app store needed

#### Hosting & Deployment
**Vercel (Free Tier)**

**Includes:**
- Unlimited bandwidth
- Automatic HTTPS
- Global CDN
- Preview deployments
- Serverless functions
- Analytics

#### Additional Technologies

**Icons:** Lucide React (beautiful, consistent icons)
**Fonts:** Inter + SF Pro Display (Apple-like typography)
**Notifications:** Web Push API + Supabase Functions
**Analytics:** Vercel Analytics (free, privacy-friendly)
**Error Tracking:** Sentry (free tier for small projects)
**Forms:** React Hook Form + Zod validation

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js 14 (App Router)                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │    React Components (TypeScript)                 │ │ │
│  │  │  - Glassmorphism UI                              │ │ │
│  │  │  - Framer Motion Animations                      │ │ │
│  │  │  - shadcn/ui + Tailwind                          │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │    State Management                              │ │ │
│  │  │  - Zustand (UI State)                            │ │ │
│  │  │  - React Query (Server State)                    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │    PWA Features                                  │ │ │
│  │  │  - Service Worker                                │ │ │
│  │  │  - Offline Support                               │ │ │
│  │  │  - Push Notifications                            │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Vercel)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Next.js API Routes & Middleware              │ │
│  │  - Authentication                                      │ │
│  │  - AI Processing                                       │ │
│  │  - Webhook Handlers                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Supabase Backend       │  │   DeepSeek AI            │
│  - PostgreSQL Database   │  │  - Task Analysis         │
│  - Real-time Subscriptions│  │  - Smart Suggestions    │
│  - Authentication        │  │  - Notification Gen      │
│  - Row Level Security    │  │  - Context Understanding │
│  - Edge Functions        │  └──────────────────────────┘
│  - Storage (1GB)         │
└──────────────────────────┘
```

### Security Architecture

**Authentication Flow:**
1. Custom login with "couple phrase" (secret passphrase)
2. Email/password for each user account
3. Session management via Supabase
4. Remember device with secure tokens
5. Automatic session refresh

**Data Security:**
- Row Level Security (RLS) in Supabase
- Each user can only access their own tasks
- Couple can access each other's tasks via shared permissions
- HTTPS everywhere (Vercel automatic)
- Environment variables for secrets
- No API keys exposed to client

**Privacy:**
- No third-party analytics tracking
- Data stored only in Supabase (EU/US regions)
- No data selling or sharing
- Can export all data anytime

---

## 🎨 Design System

### Color Palette

**Primary Glassmorphism Theme**

```css
/* Light Mode */
--glass-white: rgba(255, 255, 255, 0.7);
--glass-white-hover: rgba(255, 255, 255, 0.9);
--backdrop-blur: 20px;

--primary: #007AFF; /* iOS Blue */
--primary-hover: #0051D5;
--secondary: #5856D6; /* iOS Purple */
--accent: #FF2D55; /* iOS Pink */
--success: #34C759; /* iOS Green */
--warning: #FF9500; /* iOS Orange */
--danger: #FF3B30; /* iOS Red */

--text-primary: rgba(0, 0, 0, 0.88);
--text-secondary: rgba(0, 0, 0, 0.60);
--text-tertiary: rgba(0, 0, 0, 0.40);

--background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--background-alt: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Dark Mode */
--glass-dark: rgba(30, 30, 30, 0.7);
--glass-dark-hover: rgba(30, 30, 30, 0.9);

--text-primary-dark: rgba(255, 255, 255, 0.92);
--text-secondary-dark: rgba(255, 255, 255, 0.65);
--text-tertiary-dark: rgba(255, 255, 255, 0.45);

--background-dark: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
```

**Category Colors** (for custom categories)
```css
--category-work: #FF6B6B;
--category-school: #4ECDC4;
--category-home: #45B7D1;
--category-personal: #FFA07A;
--category-health: #98D8C8;
--category-finance: #FFD93D;
--category-social: #B565D8;
```

### Typography

**Font Stack:**
```css
/* Primary Font */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', 
             'Segoe UI', 'Roboto', sans-serif;

/* Monospace (for time, numbers) */
font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

**Type Scale:**
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

**8-Point Grid System** (consistent with Apple HIG)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Border Radius

```css
--radius-sm: 8px;   /* Small elements */
--radius-md: 12px;  /* Cards, inputs */
--radius-lg: 16px;  /* Large cards */
--radius-xl: 24px;  /* Modals, sheets */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows & Elevation

```css
/* Glassmorphism Shadows */
--shadow-glass-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
                    0 2px 4px -1px rgba(0, 0, 0, 0.03),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);

--shadow-glass-md: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
                    0 4px 6px -2px rgba(0, 0, 0, 0.04),
                    inset 0 1px 1px rgba(255, 255, 255, 0.15);

--shadow-glass-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                    0 10px 10px -5px rgba(0, 0, 0, 0.04),
                    inset 0 2px 2px rgba(255, 255, 255, 0.2);

/* Elevation System */
--elevation-1: 0 1px 3px rgba(0, 0, 0, 0.12);
--elevation-2: 0 4px 6px rgba(0, 0, 0, 0.12);
--elevation-3: 0 8px 12px rgba(0, 0, 0, 0.15);
--elevation-4: 0 16px 24px rgba(0, 0, 0, 0.18);
--elevation-5: 0 24px 36px rgba(0, 0, 0, 0.22);
```

### Component Design Specifications

#### 1. **Task Card**

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│ ○  Task Title                            ⋯      │ ← Glassmorphic card
│    Due: Today, 3:00 PM • 30 min • Work          │ ← Metadata
│                                                  │
│    ✓ Subtask 1                                  │ ← Expandable subtasks
│    ○ Subtask 2                                  │
│                                                  │
│    [Progress Bar: 50%] ⚡ Medium Energy          │ ← Visual indicators
└─────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `rgba(255, 255, 255, 0.7)`
- Backdrop blur: `20px`
- Border: `1px solid rgba(255, 255, 255, 0.3)`
- Border radius: `16px`
- Padding: `16px`
- Hover: Scale 1.02, shadow increases
- Tap: Scale 0.98
- Checkbox: Custom animated SVG
- Overflow menu: 3-dot menu (⋯) on right

**Interaction States:**
- Default: Glass effect with subtle shadow
- Hover: Slight scale + glow
- Active/Dragging: Higher elevation, stronger shadow
- Completed: Strikethrough + fade animation + checkmark explosion
- Overdue: Red accent border, pulsing glow
- Priority: Left border color indicator

#### 2. **Quick Add Input**

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│  +  What needs to be done?                  🎤  │ ← Always visible at top
└─────────────────────────────────────────────────┘
```

**Specifications:**
- Position: Sticky at top
- Background: More opaque glass `rgba(255, 255, 255, 0.95)`
- Height: `56px`
- Blur: `30px`
- Focus: Expands to show AI suggestions
- Voice icon: Triggers voice input
- Enter: Creates task
- Natural language: "Call mom tomorrow at 3pm" auto-parsed

**Smart Parsing Examples:**
- "Finish homework by Friday" → Due: Friday EOD
- "Weekly team meeting every Monday 10am" → Recurring task
- "Buy groceries tomorrow" → Due: Tomorrow, category: Home
- "Study for exam next week (2 hours)" → Due: Next week, duration: 2h

#### 3. **Navigation Bar**

**Visual Design:**
```
┌─────────────────────────────────────────────────┐
│  ≡                                      👤 🔔   │
│                                                  │
│  🏠 Today   📅 Upcoming   ✅ Done   📊 Insights  │
└─────────────────────────────────────────────────┘
```

**Specifications:**
- Fixed top position
- Glass background: `rgba(255, 255, 255, 0.85)`
- Blur: `40px`
- Height: `80px` on mobile, `60px` on desktop
- Icons: Lucide React
- Active tab: Underline + color
- Notification badge: Red dot with count

#### 4. **Celebration Overlay**

**Visual Design:**
```
        ✨ 🎉 ✨
   ┌─────────────────────┐
   │                     │
   │   Amazing Work!     │
   │   +15 XP ⭐         │
   │   3-day streak 🔥   │
   │                     │
   └─────────────────────┘
        ✨ 🎊 ✨
```

**Animation Sequence:**
1. Confetti burst from completion point (0.2s)
2. Card scales and glows (0.3s)
3. Overlay fades in with spring animation (0.4s)
4. XP counter increments (0.5s)
5. Streak indicator if applicable (0.6s)
6. Auto-dismiss after 2.5s or tap to dismiss
7. Confetti continues for 1.5s total

**Celebration Tiers:**
- **Small Task:** Subtle sparkle + soft haptic
- **Medium Task:** Confetti + XP + haptic
- **Large Task:** Fireworks + XP + streak + achievement + strong haptic
- **Milestone:** Full-screen celebration + special message from AI

#### 5. **User Badge Display**

**Her Badge (First Lady / Queen):**
```
┌──────────────────────┐
│   👑                 │
│   First Lady         │ ← Custom title
│   Level 12           │
│   🔥 7-day streak    │
│   ⭐ 1,247 XP        │
└──────────────────────┘
```

**Your Badge (Mr. President / King):**
```
┌──────────────────────┐
│   🎯                 │
│   Mr. President      │
│   Level 8            │
│   🔥 4-day streak    │
│   ⭐ 892 XP          │
└──────────────────────┘
```

**Specifications:**
- Displayed on profile screen
- Animated crown/badge icon
- Real-time XP updates
- Streak fire grows with days
- Level unlocks new themes/features

### Animation Library

**Core Principles:**
- Spring physics (feels natural, not robotic)
- Duration: 200-400ms for most interactions
- Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` for standard
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1.0)` for smooth
- Reduce motion for accessibility

**Animation Patterns:**

**1. Task Completion:**
```javascript
// Framer Motion animation
const completionVariants = {
  initial: { scale: 1, opacity: 1 },
  completing: { 
    scale: [1, 1.1, 0.95],
    opacity: [1, 1, 0.7],
    transition: { duration: 0.4 }
  },
  completed: {
    scale: 0.9,
    opacity: 0.5,
    textDecoration: 'line-through',
    transition: { duration: 0.3 }
  }
}
```

**2. Task Entry (Slide Up):**
```javascript
const taskEntryVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  }
}
```

**3. Confetti Burst:**
```javascript
// Custom canvas confetti
const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#007AFF', '#5856D6', '#FF2D55', '#34C759'],
  gravity: 1.2,
  decay: 0.94,
  scalar: 1.2
}
```

**4. Page Transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 },
  transition: {
    type: 'spring',
    stiffness: 380,
    damping: 30
  }
}
```

**5. Loading States:**
```javascript
const loadingVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
--mobile: 0px;        /* Default */
--tablet: 640px;      /* sm */
--laptop: 1024px;     /* lg */
--desktop: 1280px;    /* xl */
--wide: 1536px;       /* 2xl */
```

**Layout Adaptations:**
- **Mobile (< 640px):** Single column, bottom nav, full-width cards
- **Tablet (640px - 1024px):** Two columns, side navigation option
- **Desktop (1024px+):** Three columns, permanent sidebar, keyboard shortcuts

---

## 🚀 Core Features

### 1. **Lightning-Fast Task Capture**

**Implementation Priority: HIGHEST**

**User Flow:**
1. App opens → Quick Add already focused
2. User types/speaks
3. AI parses natural language
4. Task created in < 1 second
5. Immediate visual feedback

**Features:**

**A. Natural Language Processing**
- Parse dates: "tomorrow", "next Friday", "in 2 weeks"
- Parse times: "at 3pm", "5:30", "noon"
- Parse durations: "30 min", "2 hours", "all day"
- Parse categories: "work meeting", "school project", "home chores"
- Parse priorities: "urgent", "important", "quick"
- Parse recurring: "every Monday", "daily", "weekly on Tuesday and Thursday"

**Implementation:**
```typescript
interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  duration?: number; // minutes
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recurring?: RecurrencePattern;
  subtasks?: string[];
}

// AI Prompt for parsing
const parseTaskPrompt = `
Parse this task input and extract structured data:
Input: "${userInput}"

Extract:
- Task title (cleaned up)
- Due date/time (if mentioned)
- Duration estimate (if mentioned)
- Category (work/school/home/personal)
- Priority level
- Recurring pattern
- Potential subtasks

Return JSON only.
`;
```

**B. Voice Input**
- Web Speech API for voice recognition
- "Hey [App Name], add task..." voice command
- Works even when app is in background (PWA)
- Automatic punctuation and capitalization

**C. Keyboard Shortcuts**
- `Ctrl/Cmd + K`: Quick Add
- `Ctrl/Cmd + Enter`: Save task
- `Ctrl/Cmd + Shift + V`: Voice input
- `Escape`: Cancel
- `Tab`: Navigate fields
- `Ctrl/Cmd + Number`: Set priority

**D. Smart Defaults**
- Default due date: Today EOD
- Default category: Based on time of day
  - Morning (6am-12pm): Work
  - Afternoon (12pm-5pm): School
  - Evening (5pm-10pm): Home
  - Night (10pm-6am): Personal
- Default duration: AI estimates based on task type

**E. Quick Task Templates**
- Swipe library of common tasks
- "Coffee break" → 15 min break
- "Study session" → 2 hour blocked time with Pomodoro
- "Weekly review" → Recurring Sunday task with checklist
- Custom templates saved from frequent tasks

### 2. **Smart Task Organization**

**A. Categories**

**Default Categories:**
- 🏢 Work
- 📚 School
- 🏠 Home
- 💪 Personal/Health
- 💰 Finance
- 👥 Social
- 🎨 Creative
- 📞 Calls/Emails

**Custom Categories:**
- User can create unlimited custom categories
- Each category has:
  - Name
  - Color
  - Icon (from library)
  - Default time estimate
  - AI context (helps AI understand priority)

**Category Intelligence:**
- Auto-suggest category based on task content
- Track time spent per category
- Show category breakdown in insights
- Filter/group by category

**B. Priority System**

**Four Priority Levels:**
1. 🔴 **Urgent** - Red, top of list, push notifications
2. 🟠 **High** - Orange, needs attention today
3. 🟡 **Medium** - Yellow, important but flexible
4. 🟢 **Low** - Green, nice to have

**Smart Priority Assignment:**
- AI suggests priority based on:
  - Due date proximity
  - Task description keywords ("urgent", "ASAP")
  - User's pattern (school assignments usually high)
  - Time of day
  - Energy level required

**Priority Indicators:**
- Colored left border on task cards
- Icon badge
- Sort order
- Notification urgency

**C. Date-Based Intelligence**

**Date Awareness:**
```
┌─────────────────────────────────────┐
│  🔥 OVERDUE (2)                     │
│  ○ Task from 2 days ago             │
│  ○ Task from yesterday              │
│                                     │
│  ☀️ TODAY (5)                       │
│  ○ Morning task (9 AM)              │
│  ○ Afternoon task (2 PM)            │
│                                     │
│  📅 TOMORROW (3)                    │
│  ○ Task 1                           │
│                                     │
│  📆 THIS WEEK (8)                   │
│  ○ Monday tasks                     │
│  ○ Wednesday tasks                  │
│                                     │
│  🔮 UPCOMING (12)                   │
│  ○ Next week tasks                  │
└─────────────────────────────────────┘
```

**Visual Indicators:**
- **Overdue:** Red badge, pulsing border
- **Today:** Yellow highlight, time shown
- **Tomorrow:** Blue accent
- **This Week:** Grouped by day
- **Upcoming:** Collapsed by default

**Auto-Rescheduling:**
- Overdue tasks show "Reschedule" button
- One-tap reschedule to:
  - Today
  - Tomorrow
  - This Weekend
  - Next Week
  - Custom date
- AI learns rescheduling patterns

**D. Recurring Tasks**

**Recurrence Patterns:**
- Daily
- Weekly (select days: M T W T F S S)
- Monthly (specific date or "last Monday")
- Custom interval (every 3 days, every 2 weeks)
- Weekdays only
- Weekends only

**Smart Recurrence:**
- "Every Monday and Wednesday" → Two separate instances
- "First Monday of each month" → Calendar-aware
- "Every 14 days" → Rolling schedule
- Skip holidays (optional)
- Adjust for completed tasks (if completed early, next instance adjusts)

**Recurrence Management:**
- Edit instance: This one only
- Edit series: All future instances
- Complete instance: Marks done, creates next
- Skip instance: Removes this one, keeps series
- Pause series: Temporarily stop (for vacations)

### 3. **AI Integration (Free & Unlimited)**

**A. DeepSeek Setup**

**API Configuration:**
```typescript
// lib/ai/deepseek.ts
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(prompt: string, systemPrompt?: string) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // Free key
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  return response.json();
}
```

**B. AI Features**

**1. Task Breakdown**
```
User enters: "Complete research paper"

AI suggests:
○ Outline main topics (30 min)
○ Research sources (1.5 hours)
○ Write introduction (45 min)
○ Draft body paragraphs (2 hours)
○ Write conclusion (30 min)
○ Edit and proofread (1 hour)
○ Format citations (30 min)
○ Final review (20 min)
```

**2. Smart Scheduling**
```
AI considers:
- Existing tasks today
- Available time blocks
- Energy level requirements
- Task dependencies
- Deadlines
- User's productivity patterns

Suggests optimal time slots for each task
```

**3. Contextual Suggestions**
```
When user adds "Study for midterm":

AI suggests:
- Create study schedule (3 days before)
- Gather materials (2 days before)
- Review notes (night before)
- Get good sleep (reminder)
- Arrive early (morning of)
```

**4. Intelligent Notifications**

**AI-Generated Messages:**
```typescript
// Example AI notification generation
const notificationPrompt = `
Generate a loving, supportive notification for my wife.

Context:
- Task: ${task.title}
- Due: ${task.dueDate}
- She's been stressed lately
- She's at work right now
- Tone: Supportive partner, not bossy

Make it feel like I'm personally reminding her. Keep it warm, brief, encouraging.
`;

// AI Response examples:
"Hey love, just a gentle reminder about your presentation prep. You've got this! 💕"
"Don't forget to call your advisor at 3pm. I know you've been meaning to! ☺️"
"Quick break time! You've been crushing it today. Stretch those legs! 🌟"
```

**Notification Timing:**
- Morning motivation (7-8 AM)
- Mid-morning check-in (10-11 AM)
- Lunch reminder (12-1 PM)
- Afternoon boost (3-4 PM)
- Evening wind-down (7-8 PM)
- Bedtime prep (9-10 PM)

**Notification Types:**
- Task reminders (15 min before, customizable)
- Motivational messages (random throughout day)
- Streak reminders (if about to break)
- Achievement celebrations
- Gentle nudges for overdue tasks
- End-of-day review prompts
- Weekly planning suggestions

**5. Energy Level Awareness**

**AI Learns:**
- What tasks she completes when
- Energy patterns (morning person vs night owl)
- Stress indicators (lots of reschedules = overwhelm)
- Productive days vs difficult days

**AI Adapts:**
- Suggests high-energy tasks during peak hours
- Recommends breaks when detecting fatigue
- Adjusts notification tone based on day quality
- Offers encouragement during tough periods

**6. Context Detection**

**Location-Based (via browser geolocation, if permitted):**
- At work → Work tasks prioritized
- At home → Home/personal tasks visible
- At school → School tasks front and center
- Commuting → Quick tasks or podcast suggestions

**Time-Based:**
- Workday (Mon-Fri 8am-5pm) → Professional tone
- Evening → Relaxed tone, self-care reminders
- Weekend → Personal tasks, fun activities
- Late night → Gentle bedtime reminders

**Calendar Integration (Future):**
- Sync with Google Calendar
- Detect busy vs free time
- Suggest task scheduling around meetings

### 4. **Couple Features**

**A. Dual Login System**

**Login Flow:**
```
┌─────────────────────────────────────┐
│                                     │
│      Together Tasks 💕              │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ Enter your secret phrase    │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌──────────┐   ┌──────────┐      │
│   │   👑     │   │   🎯    │      │
│   │  Queen   │   │  King    │      │
│   └──────────┘   └──────────┘      │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
1. First-time setup:
   - Create couple passphrase (e.g., "our little secret 2025")
   - Create her account (email + password)
   - Create your account (email + password)
   - Assign badges

2. Daily use:
   - Enter passphrase → Show both profiles
   - Tap profile → Auto-login (device remembered)
   - No password needed on trusted devices

3. Security:
   - Passphrase stored hashed
   - Each account still has email/password for security
   - Can revoke device access remotely
   - Two-factor optional for sensitive tasks

**B. Profile Badges**

**Her Profile:**
- Title: "First Lady" or "Queen" or "CEO of Everything"
- Crown icon 👑
- Special color theme (her favorite)
- Custom avatar
- Stats displayed prominently

**Your Profile:**
- Title: "Mr. President" or "King" or "Support Manager"
- Icon 🎯 or 👨‍💼
- Complementary color theme
- Custom avatar
- Stats displayed

**Badge Customization:**
- Change titles anytime
- Unlock new titles with achievements
- Special anniversary badges
- Couple milestone badges

**C. Cross-Account Visibility**

**Permissions:**
```typescript
interface CouplePermissions {
  canView: boolean;           // See each other's tasks
  canAdd: boolean;            // Add to each other's lists
  canEdit: boolean;           // Edit each other's tasks
  canComplete: boolean;       // Complete each other's tasks
  canDelete: boolean;         // Delete (usually false)
  canViewPrivate: boolean;    // See private tasks
}
```

**Default Setup:**
- Both can view all tasks
- Both can add to each other's lists
- Can edit own added tasks only
- Cannot complete for each other (encouragement only)
- Private tasks stay private

**D. Shared Tasks**

**Task Assignment:**
```
┌─────────────────────────────────────┐
│  ○ Buy groceries                    │
│     Assigned to: 👑 Her             │
│     Added by: 🎯 You               │
│     Status: In Progress             │
└─────────────────────────────────────┘
```

**Features:**
- Assign tasks to each other
- See who added what
- Shared completion celebration
- Joint tasks (both need to complete)

**E. Couple Dashboard**

```
┌─────────────────────────────────────┐
│      💕 Couple Progress             │
│                                     │
│   This Week:                        │
│   👑 Her: 23 tasks ✓                │
│   🎯 You: 17 tasks ✓                │
│                                     │
│   Combined Streak: 🔥 12 days       │
│   Total XP: ⭐ 2,139                │
│                                     │
│   Shared Goals:                     │
│   ○ Plan weekend trip               │
│   ○ Organize garage                 │
│                                     │
└─────────────────────────────────────┘
```

**F. Support Messages**

**You can:**
- Leave encouraging notes on her tasks
- React with emojis (❤️, 💪, 🎉)
- Add voice notes
- Attach motivational GIFs
- Set up surprise celebrations

**AI assists:**
- Suggests what encouragement to send
- Reminds you to check in
- Celebrates her wins on your behalf

### 5. **Gamification & Celebration**

**A. XP System**

**Earning XP:**
- Complete task: 10-50 XP (based on difficulty)
- Complete on time: +5 XP bonus
- Complete early: +10 XP bonus
- Complete subtask: 5 XP each
- Maintain streak: 10 XP/day
- Help partner: 15 XP bonus
- Use AI breakdown: +5 XP (encourages good habits)

**XP Calculation:**
```typescript
function calculateXP(task: Task): number {
  let xp = 10; // Base XP
  
  // Difficulty multiplier
  if (task.duration > 120) xp *= 2; // 2+ hours
  if (task.priority === 'urgent') xp *= 1.5;
  
  // Subtasks bonus
  xp += task.subtasks?.filter(st => st.completed).length * 5;
  
  // Timing bonus
  if (task.completedAt < task.dueDate) xp += 10; // Early
  else if (isToday(task.dueDate)) xp += 5; // On time
  
  // Streak bonus
  if (userStreak >= 7) xp *= 1.2;
  
  return Math.round(xp);
}
```

**B. Level System**

**Levels:**
- Level 1-5: Beginner (0-500 XP)
- Level 6-10: Getting Started (500-1500 XP)
- Level 11-20: Task Master (1500-5000 XP)
- Level 21-30: Productivity Pro (5000-15000 XP)
- Level 31+: Legend (15000+ XP)

**Level Benefits:**
- Unlock new themes
- Unlock new celebration styles
- Unlock advanced features
- Unlock badges and titles
- Better AI suggestions (learns more)

**C. Streak System**

**Daily Streaks:**
- Complete at least 1 task daily
- Visual fire indicator 🔥
- Shows current streak
- Shows longest streak ever
- Freeze days (2 per month - skip without breaking)

**Weekly Streaks:**
- Complete X tasks per week (customizable goal)
- Achievement badge for 4-week streak
- Leaderboard with partner (friendly competition)

**Streak Rewards:**
- 7 days: Bronze badge
- 30 days: Silver badge
- 90 days: Gold badge
- 365 days: Diamond badge

**D. Celebration Types**

**1. Task Completion (Small)**
- Subtle scale animation
- Soft confetti (3-5 pieces)
- Checkmark with glow
- XP popup (+15 XP)
- Soft haptic feedback

**2. Task Completion (Medium)**
- Confetti burst (20-30 pieces)
- Card glows
- XP popup with animation
- "Great job!" message
- Medium haptic

**3. Task Completion (Large/Important)**
- Full confetti explosion (100 pieces)
- Screen flash effect
- Fireworks animation
- AI-generated congratulations
- XP popup + level up check
- Strong haptic
- Sound effect (optional)

**4. Milestone Celebrations**
```
┌─────────────────────────────────────┐
│          🎊 MILESTONE! 🎊           │
│                                     │
│      100 Tasks Completed!           │
│                                     │
│     You're absolutely crushing it!  │
│     Keep up the amazing work! 💪    │
│                                     │
│         +100 XP BONUS               │
│       🏆 Achievement Unlocked       │
│                                     │
└─────────────────────────────────────┘
```

**Milestones:**
- First task completed
- 10 tasks completed
- 50 tasks completed
- 100 tasks completed
- 500 tasks completed
- First week streak
- First month streak
- Level up (every level)
- Perfect day (all tasks done)
- Perfect week

**E. Achievements/Badges**

**Achievement Categories:**

**Productivity:**
- 🌟 Early Bird: Complete 10 tasks before 9 AM
- 🦉 Night Owl: Complete 10 tasks after 9 PM
- ⚡ Speed Demon: Complete 5 tasks in 1 hour
- 🎯 Sharpshooter: Complete 20 tasks without missing one
- 📚 Scholar: Complete 50 school tasks

**Consistency:**
- 🔥 Week Warrior: 7-day streak
- 🏆 Month Master: 30-day streak
- 💎 Year Legend: 365-day streak
- 📅 Perfect Week: All weekly tasks done

**Teamwork:**
- 💕 Partner in Productivity: Help partner with 10 tasks
- 👥 Team Player: Complete 5 shared tasks
- 🤝 Support System: Leave 20 encouraging notes

**Mastery:**
- 🎨 Organizer: Create 10 custom categories
- 🤖 AI Enthusiast: Use AI breakdown 25 times
- 📊 Data Lover: Check insights 15 times
- 🎵 Maestro: Use voice input 30 times

**Special:**
- 💍 First Tasks Together: Both complete a task same day
- 🎂 Anniversary: Use app for 1 year
- 🌈 Mood Booster: Complete tasks on 10 different days

**F. Progress Visualization**

**Daily Progress Ring:**
```
     🔥 7
    ╱────╲
   ╱      ╲    5/8 tasks
  │   75%  │   completed today
   ╲      ╱
    ╲────╱
```

**Weekly Dashboard:**
```
Mon ████████░░ 80%
Tue ██████░░░░ 60%
Wed ██████████ 100% ⭐
Thu ████░░░░░░ 40%
Fri ████████░░ 75%
Sat ░░░░░░░░░░ 0%
Sun ░░░░░░░░░░ 0%
```

**Monthly Calendar:**
- Green dots for completed days
- Intensity shows # of tasks
- Gaps show missed days
- Patterns visible at glance

**G. Sound Effects (Optional)**

**Sounds:**
- Task complete: Soft "ding"
- Level up: Ascending chime
- Achievement: Fanfare
- Streak milestone: Special jingle
- Can toggle on/off
- Volume control
- Mute during work hours

### 6. **Advanced Task Features**

**A. Subtasks**

**Creating Subtasks:**
- Tap "Add subtask" on any task
- AI can suggest subtasks
- Drag to reorder
- Indent for sub-subtasks (max 2 levels)

**Visual:**
```
○ Complete Project
  ✓ Research phase
  ✓ Outline document
  ○ Write draft
    ○ Introduction
    ○ Body
    ○ Conclusion
  ○ Review and edit
```

**Progress:**
- Parent task shows subtask completion (3/6)
- Progress bar visual
- Can complete parent to complete all
- Can complete individually

**B. Time Estimates**

**Features:**
- Add duration to any task
- AI suggests based on task type
- Track actual time taken
- Learn from patterns
- Sum up for daily planning

**Time Blocking:**
```
Today's Schedule:
9:00 - 9:30   Morning routine (30m)
9:30 - 11:00  Study session (90m)
11:00 - 11:15 Break (15m)
11:15 - 12:30 Work task (75m)
12:30 - 1:30  Lunch (60m)
...
```

**C. Energy Levels**

**Tag tasks by energy:**
- ⚡⚡⚡ High energy (challenging work)
- ⚡⚡ Medium energy (normal tasks)
- ⚡ Low energy (easy tasks)

**AI uses this to:**
- Schedule high-energy tasks during peak hours
- Suggest low-energy tasks when tired
- Balance energy throughout day

**D. Task Dependencies**

**Features:**
- Mark tasks as "blocked by" another task
- Visual dependency chain
- Auto-schedule when blocker completes
- Prevent completing out of order

**Example:**
```
○ Write paper (blocked by Research)
  ↑
○ Research sources (must complete first)
```

**E. Attachments & Notes**

**Attach to tasks:**
- Photos (via camera or upload)
- Files (PDF, DOC, etc.)
- Voice notes
- Links
- Location

**Notes:**
- Rich text editor
- Markdown support
- Checklists within notes
- Code blocks for technical tasks

**F. Task Templates**

**Save as template:**
- Frequent tasks → One-click recreate
- Include all subtasks and settings
- Share templates with partner
- Import community templates

**Example Templates:**
- "Weekly Review" - every Sunday
- "Grocery Shopping" - with common items
- "Study Session" - with Pomodoro breaks
- "Workout Routine" - with exercises

### 7. **Smart Views & Filters**

**A. View Options**

**Today View:**
- All tasks due today
- Sorted by time, then priority
- Quick reschedule options
- Add time slots visually

**Upcoming View:**
- Next 7 days
- Grouped by date
- Can drag to reschedule
- Color-coded by category

**All Tasks View:**
- Every active task
- Filter by category, priority, tag
- Sort by date, priority, XP, name
- Bulk actions

**Completed View:**
- Archive of done tasks
- Filter by date range
- Stats and insights
- Can uncomplete if mistake

**Insights View:**
- Productivity analytics
- Completion rate
- Category breakdown
- Time analysis
- Streak history
- XP earnings over time

**Focus View:**
- Minimalist mode
- One task at a time
- Pomodoro timer
- Distraction-free
- Full-screen option

**B. Filters**

**Filter by:**
- Category (multi-select)
- Priority (multi-select)
- Date range
- Duration (< 30 min, 30-60 min, > 1 hour)
- Energy level
- Assigned to (in couple mode)
- Has attachments
- Has subtasks
- Recurring vs one-time

**Smart Filters:**
- "Quick Wins" - Tasks < 15 min
- "Deep Work" - Tasks > 1 hour, high energy
- "Overdue" - Past due date
- "This Week" - Due within 7 days
- "No Category" - Uncategorized tasks

**C. Search**

**Features:**
- Full-text search
- Search in task titles
- Search in notes
- Search in subtasks
- Recent searches
- Search suggestions

**Search Syntax:**
```
"homework" → Find all with homework
#school → Find category
@high → Find priority
due:today → Find by date
>1h → Find by duration
```

### 8. **Notifications & Reminders**

**A. Notification System**

**Browser Push Notifications:**
- Must request permission
- Works even when app closed (PWA)
- Custom icon and badge
- Action buttons

**Notification Types:**

**1. Task Reminders:**
- 15 min before due (default)
- Custom timing (1h, 30m, 5m before)
- Recurring task reminders
- Location-based (if enabled)

**2. Daily Digest:**
- Morning summary (8 AM)
  - "Good morning! You have 6 tasks today"
  - Top 3 priorities highlighted
  - Weather integration (optional)
- Evening recap (8 PM)
  - "You completed 5/6 tasks today! 🎉"
  - Tomorrow's preview
  - Encourage prepare for next day

**3. Motivational:**
- Random throughout day
- AI-generated personal messages
- Adjust frequency in settings
- Can specify quiet hours

**4. Streak Alerts:**
- "You're about to break your 12-day streak!"
- Sent 9 PM if no tasks completed yet
- Can use a freeze day

**5. Achievement Notifications:**
- "🏆 Achievement Unlocked: Week Warrior!"
- Real-time when earned
- Can tap to see badge

**B. AI-Personalized Messages**

**Message Generation:**
```typescript
const generateNotification = async (context) => {
  const prompt = `
  Generate a notification for my wife's to-do app.
  
  Context:
  - Time: ${context.time}
  - Her name: ${context.userName}
  - Task: ${context.task}
  - Her mood lately: ${context.recentActivity}
  - Relationship: Loving partner
  
  Write as if I (her partner) am sending this.
  Tone: Warm, supportive, brief (max 20 words).
  No generic phrases, make it personal.
  `;
  
  return await callDeepSeek(prompt);
};
```

**Example Outputs:**
- "Hey love! Don't forget your 3pm meeting. You've got this! 💕"
- "Time for a quick break! You've been crushing it all morning 🌟"
- "Just a gentle nudge about groceries. I'll help when you get home! 😊"
- "You're so close to finishing! One more task and you're done for the day! 💪"

**C. Notification Timing Intelligence**

**AI learns:**
- When she's most responsive
- When she dismisses without action
- Best times for different task types
- Avoid notification fatigue

**Adaptive:**
- Reduce frequency if often dismissed
- Increase urgency for overdue
- Gentle nudges for new habits
- Celebrate small wins

**D. Quiet Hours**

**Features:**
- Set do-not-disturb hours
- Still show in-app but no push
- Emergency override for urgent
- Auto-detect sleep schedule

**Smart Defaults:**
- Quiet: 10 PM - 7 AM
- Reduce during work meetings (calendar sync)
- Pause on weekends (optional)

### 9. **Insights & Analytics**

**A. Dashboard Overview**

```
┌─────────────────────────────────────┐
│       📊 Your Productivity          │
│                                     │
│  This Week:                         │
│  ████████████░░ 87% completion      │
│  23/26 tasks ✓                      │
│                                     │
│  Streak: 🔥 12 days                 │
│  XP Earned: ⭐ 347                  │
│  Level: 14 (Next: 89 XP)            │
│                                     │
│  Time Spent:                        │
│  Work     ███████░░ 8.5h            │
│  School   █████████░ 12h            │
│  Home     ████░░░░░ 4h              │
│                                     │
└─────────────────────────────────────┘
```

**B. Detailed Analytics**

**Completion Rate:**
- Daily/weekly/monthly graphs
- Compare to previous periods
- Identify patterns and trends
- Celebrate improvements

**Category Breakdown:**
- Pie chart of time per category
- Bar chart of tasks per category
- Which categories take longest
- Which are most frequent

**Time Analysis:**
- Estimated vs actual time
- Improve future estimates
- Identify time sinks
- Productivity by hour of day

**Productivity Heatmap:**
- Calendar view
- Color intensity = # tasks
- Identify productive days/weeks
- Spot productivity dips

**Completion Trends:**
```
Week-over-week completion:
Week 1: 82%
Week 2: 85% ↑
Week 3: 91% ↑
Week 4: 87% ↓
```

**C. AI Insights**

**Weekly Summary:**
```
This Week's Insights:

✨ You completed 23% more tasks than last week!
📚 School tasks took 15% less time - you're getting faster!
🔥 Your 12-day streak is your longest yet!
⚠️ You rescheduled work tasks 4 times - consider blocking more time.

Suggestion: Try time-blocking for work tasks to reduce reschedules.
```

**Patterns Detected:**
- "You're most productive on Tuesdays"
- "Morning tasks are completed 30% more often"
- "High-energy tasks often get rescheduled"
- "You work best in 90-minute blocks"

**Recommendations:**
- "Schedule deep work for Tuesday mornings"
- "Move high-energy tasks to 9-11 AM"
- "Take breaks every 90 minutes"
- "Batch similar tasks together"

**D. Couple Insights**

**Together Stats:**
```
💕 Couple Productivity

Combined Completion: 89%
Together Streak: 🔥 12 days

This Week:
👑 Her: 23 tasks, 8.2/10 happiness
🎯 You: 17 tasks, 7.5/10 happiness

Support Given:
You helped her: 5 tasks
She helped you: 3 tasks

Shared Goals:
2/5 completed this week
```

**E. Export Data**

**Export Options:**
- CSV for spreadsheet analysis
- JSON for raw data
- PDF report (beautiful formatted)
- Image of key stats (for sharing)

**Privacy:**
- All data stays in your control
- No third-party tracking
- Can delete all data anytime

---

## 💾 Database Schema

### Supabase Tables

**1. users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  badge_title TEXT DEFAULT 'Member', -- Queen, King, etc.
  badge_icon TEXT DEFAULT '👤',
  avatar_url TEXT,
  couple_id UUID REFERENCES couples(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity DATE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. couples**
```sql
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passphrase_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  user1_id UUID REFERENCES users(id),
  user2_id UUID REFERENCES users(id)
);
```

**3. tasks**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'active', -- active, completed, deleted
  
  -- Dates
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMP,
  
  -- Metadata
  duration_estimate INTEGER, -- minutes
  duration_actual INTEGER,
  energy_level TEXT, -- low, medium, high
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {type: 'daily', days: [1,3,5], interval: 1}
  parent_recurring_id UUID REFERENCES tasks(id),
  
  -- Gamification
  xp_value INTEGER DEFAULT 10,
  celebration_type TEXT DEFAULT 'small', -- small, medium, large
  
  -- Relations
  parent_task_id UUID REFERENCES tasks(id), -- for subtasks
  position INTEGER DEFAULT 0,
  
  -- Couple features
  added_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT false,
  
  -- AI
  ai_suggested_subtasks JSONB,
  ai_time_estimate INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
```

**4. categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#007AFF',
  icon TEXT DEFAULT '📁',
  default_duration INTEGER, -- default time estimate
  ai_context TEXT, -- help AI understand category
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**5. achievements**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  condition JSONB, -- {type: 'streak', value: 7}
  rarity TEXT DEFAULT 'common' -- common, rare, epic, legendary
);
```

**6. user_achievements**
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

**7. task_attachments**
```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- image, file, voice, link
  url TEXT NOT NULL,
  filename TEXT,
  size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**8. notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  type TEXT NOT NULL, -- reminder, achievement, motivational
  title TEXT NOT NULL,
  body TEXT,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**9. activity_log**
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  action TEXT NOT NULL, -- created, completed, updated, deleted
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**10. daily_stats**
```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- minutes
  categories JSONB, -- {work: 3, school: 5}
  UNIQUE(user_id, date)
);
```

### Row Level Security (RLS) Policies

**Enable RLS:**
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- etc for all tables
```

**Example Policies:**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Couples can see each other's tasks
CREATE POLICY "Couples can view partner tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples c
      JOIN users u1 ON u1.couple_id = c.id
      JOIN users u2 ON u2.couple_id = c.id
      WHERE u1.id = auth.uid()
      AND u2.id = tasks.user_id
    )
  );
```

---

## 🎯 User Experience Flow

### First-Time User Experience

**1. Landing Page** (Before Login)
```
┌─────────────────────────────────────┐
│                                     │
│       Together Tasks 💕             │
│                                     │
│   Productivity, but make it fun     │
│                                     │
│   ┌───────────────────────────┐    │
│   │   Get Started             │    │
│   └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**2. Couple Setup**
```
Step 1: Create your couple passphrase
"This is just between you two!"
[________________]

Step 2: Her Account
Name: [________]
Email: [________]
Password: [________]
Badge Title: [First Lady ▼]

Step 3: Your Account
Name: [________]
Email: [________]
Password: [________]
Badge Title: [Mr. President ▼]

Step 4: Install App
"Add to Home Screen for best experience"
[Install Now] [Maybe Later]
```

**3. Onboarding Tutorial** (Interactive)
```
Screen 1: "Add your first task"
→ Shows quick add input
→ User types something
→ Celebrates first task!

Screen 2: "Complete a task"
→ User taps checkbox
→ Confetti! XP earned!

Screen 3: "Your partner can see your tasks"
→ Shows couple view
→ Demo of adding to partner's list

Screen 4: "Let AI help you"
→ Shows AI breakdown feature
→ Creates sample task with subtasks

Screen 5: "You're all set!"
→ Achievement unlocked: Getting Started
→ +50 XP bonus
```

**4. First Day Experience**

**Morning (8 AM):**
- Push notification: "Good morning! Ready to crush today? 💪"
- Opens to clean, empty Today view
- Quick add is pre-focused
- Suggestion: "Try adding your first task!"

**After First Task Added:**
- Celebration animation
- "Great start! What else needs to be done?"
- AI suggests: "Want me to break this down into steps?"

**After First Task Completed:**
- Big celebration
- "You did it! +15 XP"
- Achievement: "First Task"
- Encourages adding more

**Evening (8 PM):**
- Push notification: "Amazing work today! You completed X tasks"
- Shows daily summary
- Suggests: "Want to plan tomorrow?"

### Daily User Flow

**Morning Routine:**
1. Open app (already logged in)
2. See: "Good morning, [Name]!"
3. Today view shows: 
   - Tasks due today
   - Overdue tasks (if any)
   - Time blocks
4. Quick add new tasks
5. Drag to reorder priorities
6. Set notifications for key tasks

**Throughout Day:**
1. Notifications remind of tasks
2. Complete tasks → Instant celebration
3. Add tasks as they come up (< 3 seconds)
4. Check off subtasks
5. Adjust schedule as needed

**Evening Routine:**
1. Review completed tasks
2. Celebrate the day's progress
3. Reschedule incomplete tasks
4. Preview tomorrow
5. Set up tomorrow's priorities

**Weekend Flow:**
1. More relaxed notifications
2. Focus on personal/home tasks
3. Plan the week ahead
4. Couple tasks featured
5. Fun achievements showcased

### Interaction Patterns

**Task Creation:**
1. Tap quick add OR press Cmd+K
2. Type naturally
3. AI parses (instant)
4. Shows preview with details
5. Tap Enter to confirm
6. Task appears with animation
7. Can immediately add another

**Task Completion:**
1. Tap checkbox
2. Checkmark animates
3. Task card does completion animation
4. Confetti bursts
5. XP popup appears
6. Task fades/strikes through
7. Next task slides up

**Task Editing:**
1. Tap task card
2. Expands to show details
3. Edit any field inline
4. Changes save automatically
5. Collapse to return

**Browsing Tasks:**
1. Scroll through views
2. Swipe left for quick actions (complete, delete, reschedule)
3. Tap for details
4. Drag to reorder
5. Pinch to compact view
6. Pull to refresh

### Error States & Empty States

**Empty States:**

**No Tasks Today:**
```
┌─────────────────────────────────────┐
│         🎉                          │
│    You're all clear!                │
│                                     │
│  No tasks due today.                │
│  Enjoy your free time!              │
│                                     │
│  [Add a Task]                       │
└─────────────────────────────────────┘
```

**No Completed Tasks:**
```
┌─────────────────────────────────────┐
│         📭                          │
│   No completed tasks yet            │
│                                     │
│  Start checking off some tasks!     │
│  You've got this! 💪                │
└─────────────────────────────────────┘
```

**Error States:**

**Network Error:**
```
┌─────────────────────────────────────┐
│         📡                          │
│   Couldn't connect                  │
│                                     │
│  Using cached data from earlier.    │
│  Your changes will sync when        │
│  you're back online.                │
│                                     │
│  [Retry]                            │
└─────────────────────────────────────┘
```

**Sync Conflict:**
```
┌─────────────────────────────────────┐
│         ⚠️                          │
│   Sync conflict detected            │
│                                     │
│  Your version: "Buy milk"           │
│  Partner's version: "Buy milk       │
│                     and eggs"       │
│                                     │
│  [Keep Mine] [Keep Theirs] [Merge] │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core MVP (Week 1-2)

**Goals:** Basic task management + login + couple features

**Week 1:**
- [ ] Project setup (Next.js, TypeScript, Tailwind, Supabase)
- [ ] Authentication system (couple passphrase + profiles)
- [ ] Database schema implementation
- [ ] Basic UI components (shadcn/ui setup)
- [ ] Quick add input
- [ ] Task list view (Today)
- [ ] Task CRUD operations
- [ ] Basic glassmorphism styling

**Week 2:**
- [ ] Task completion with animation
- [ ] Categories (default + custom)
- [ ] Priority system
- [ ] Due dates and times
- [ ] Couple sync (real-time updates)
- [ ] Profile badges
- [ ] Basic XP system
- [ ] Simple celebrations

**Deliverable:** Working to-do app with couple features, basic gamification

### Phase 2: Smart Features (Week 3-4)

**Goals:** AI integration + recurring tasks + subtasks

**Week 3:**
- [ ] DeepSeek AI integration
- [ ] Natural language parsing
- [ ] AI task breakdown
- [ ] Recurring task system
- [ ] Subtask functionality
- [ ] Time estimates
- [ ] Energy levels

**Week 4:**
- [ ] Smart scheduling suggestions
- [ ] Context detection (time-based)
- [ ] Better animations (Framer Motion)
- [ ] Notification system setup
- [ ] Push notification permissions
- [ ] Basic daily digest

**Deliverable:** Intelligent task management with AI assistance

### Phase 3: Gamification Polish (Week 5-6)

**Goals:** Full gamification + celebrations + insights

**Week 5:**
- [ ] Level system implementation
- [ ] Streak tracking
- [ ] Achievement system
- [ ] All celebration types
- [ ] Confetti and fireworks
- [ ] Sound effects (optional)
- [ ] Haptic feedback

**Week 6:**
- [ ] Insights dashboard
- [ ] Analytics charts
- [ ] Progress visualization
- [ ] AI insights and recommendations
- [ ] Couple dashboard
- [ ] Export functionality

**Deliverable:** Fully gamified experience with analytics

### Phase 4: PWA & Polish (Week 7-8)

**Goals:** Native app experience + performance + accessibility

**Week 7:**
- [ ] PWA setup (manifest, service worker)
- [ ] Offline support
- [ ] Install prompts
- [ ] App icon and splash screen
- [ ] Advanced push notifications
- [ ] Background sync

**Week 8:**
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG)
- [ ] Responsive design polish
- [ ] Keyboard shortcuts
- [ ] Dark mode polish
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Testing (unit + integration)

**Deliverable:** Production-ready PWA

### Phase 5: Advanced Features (Week 9-10)

**Goals:** Voice input + templates + advanced AI

**Week 9:**
- [ ] Voice input integration
- [ ] Voice commands
- [ ] Task templates
- [ ] Attachments support
- [ ] Rich notes editor
- [ ] Task dependencies

**Week 10:**
- [ ] AI personality customization
- [ ] More AI features (better suggestions)
- [ ] Focus mode
- [ ] Pomodoro timer
- [ ] Quick wins section
- [ ] Location-based features (optional)

**Deliverable:** Feature-complete app

### Phase 6: Testing & Launch (Week 11-12)

**Goals:** Bug fixes + user testing + deployment

**Week 11:**
- [ ] Beta testing with your wife
- [ ] Gather feedback
- [ ] Bug fixes
- [ ] Performance tuning
- [ ] Security audit
- [ ] Privacy policy

**Week 12:**
- [ ] Final polish
- [ ] Documentation
- [ ] Deployment to Vercel
- [ ] Domain setup (optional)
- [ ] Monitoring setup
- [ ] Launch! 🎉

**Deliverable:** Live production app

### Optional Future Enhancements

**Phase 7+:**
- Calendar integration (Google Calendar)
- Team features (beyond couple)
- Habit tracking
- Journal integration
- Mind map view
- Eisenhower matrix view
- Kanban board view
- Time tracking advanced features
- Budget tracking
- Health tracking integration
- Spotify integration (study playlists)
- Weather-based suggestions
- Social sharing (achievements)
- Web clipper extension
- Email-to-task
- SMS reminders
- Siri/Google Assistant shortcuts
- Apple Watch companion
- Wear OS companion

---

## 🌐 Deployment Strategy

### Vercel Deployment (Free)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables:**
```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DEEPSEEK_API_KEY=your_deepseek_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (set in Vercel dashboard)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEEPSEEK_API_KEY=...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Vercel Configuration:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### Supabase Setup (Free)

**1. Create Project:**
- Go to supabase.com
- Create new project
- Note down: URL, anon key, service role key

**2. Run Migrations:**
```sql
-- Copy all table creation scripts from Database Schema section
-- Run in Supabase SQL Editor
```

**3. Enable RLS:**
```sql
-- Copy all RLS policies
-- Run in Supabase SQL Editor
```

**4. Set up Auth:**
- Enable email/password auth
- Configure email templates
- Set redirect URLs

**5. Storage Setup:**
- Create bucket: "task-attachments"
- Set public/private policies
- Configure file size limits

### PWA Configuration

**1. manifest.json:**
```json
{
  "name": "Together Tasks",
  "short_name": "Tasks",
  "description": "Productivity made fun for couples",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Add Task",
      "short_name": "Add",
      "description": "Quickly add a new task",
      "url": "/?action=add",
      "icons": [
        {
          "src": "/icons/add-icon.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Today's Tasks",
      "short_name": "Today",
      "description": "View today's tasks",
      "url": "/?view=today",
      "icons": [
        {
          "src": "/icons/today-icon.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

**2. Service Worker:**
```javascript
// public/sw.js
// Generated by next-pwa, handles:
// - Offline caching
// - Background sync
// - Push notifications
```

**3. Push Notifications:**
```typescript
// Request permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'your-vapid-public-key'
      });
      // Save subscription to database
    }
  }
};
```

### Domain & SSL (Optional)

**Free Options:**
- Use Vercel's free domain: your-app.vercel.app
- Custom domain: Buy from Namecheap (~$10/year)
  - Configure in Vercel dashboard
  - Automatic SSL via Let's Encrypt

### Monitoring & Analytics

**Vercel Analytics (Free):**
- Automatically enabled
- Page views, web vitals
- No setup required

**Sentry Error Tracking (Free Tier):**
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Backup Strategy

**Automated Backups:**
- Supabase: Automatic daily backups (included)
- Point-in-time recovery (7 days)
- Manual backups before major changes

**Export Functionality:**
- Users can export their data anytime
- CSV, JSON, PDF formats
- Ensures data ownership

---

## 🔮 Future Enhancements

### Near-Term (Next 3-6 Months)

1. **Calendar Integration**
   - Sync with Google Calendar
   - Two-way sync (create events from tasks)
   - Visual calendar view
   - Time blocking drag-and-drop

2. **Habit Tracking**
   - Daily habits
   - Habit streaks separate from task streaks
   - Habit-specific insights
   - Habit stacking (link habits)

3. **Advanced AI**
   - Voice conversations with AI
   - AI scheduling assistant
   - Predictive task suggestions
   - Mood-based task recommendations

4. **Team Features**
   - Beyond couple: small teams
   - Shared projects
   - Task delegation
   - Progress tracking

5. **Integrations**
   - Spotify (study playlists)
   - Notion (import tasks)
   - Trello (migration)
   - Slack (notifications)

### Mid-Term (6-12 Months)

1. **Mobile Apps** (React Native)
   - iOS native app
   - Android native app
   - Better mobile experience
   - Widget support

2. **Smart Home Integration**
   - Google Home commands
   - Alexa skills
   - Location-based triggers
   - Home automation scenarios

3. **Health Integration**
   - Apple Health
   - Google Fit
   - Sleep tracking influence
   - Exercise task integration

4. **Financial Tracking**
   - Budget tasks
   - Bill reminders
   - Expense tracking
   - Financial goals

5. **Social Features**
   - Share achievements
   - Public profiles (optional)
   - Community templates
   - Leaderboards (opt-in)

### Long-Term (1-2 Years)

1. **AI Advancements**
   - GPT-4/5 integration when stable
   - Personalized AI personality
   - Predictive planning
   - Natural conversation

2. **Enterprise Version**
   - Team management
   - Admin dashboard
   - Advanced analytics
   - SSO integration

3. **Wearables**
   - Apple Watch app
   - Wear OS app
   - Fitness band integration
   - Quick task check-ins

4. **AR/VR** (Experimental)
   - Vision Pro task management
   - Spatial task organization
   - Immersive focus mode

5. **Monetization** (If desired)
   - Premium themes
   - Advanced AI features
   - Team plans
   - Custom integrations
   - Always free for couples!

---

## 📚 Development Best Practices

### Code Organization

```
together-tasks/
├── app/                    # Next.js app directory
│   ├── (auth)/
│   │   ├── login/
│   │   └── setup/
│   ├── (dashboard)/
│   │   ├── today/
│   │   ├── upcoming/
│   │   ├── completed/
│   │   └── insights/
│   ├── api/                # API routes
│   │   ├── tasks/
│   │   ├── ai/
│   │   └── notifications/
│   └── layout.tsx
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── tasks/
│   ├── gamification/
│   └── shared/
├── lib/                    # Utilities
│   ├── supabase.ts
│   ├── ai/
│   ├── animations/
│   └── utils.ts
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── styles/                 # Global styles
├── public/                 # Static assets
│   ├── icons/
│   ├── sounds/
│   └── sw.js
├── supabase/               # Database migrations
│   └── migrations/
└── tests/                  # Test files
```

### TypeScript Types

```typescript
// types/task.ts
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'deleted';
  
  dueDate?: Date;
  dueTime?: string;
  completedAt?: Date;
  
  durationEstimate?: number;
  durationActual?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentRecurringId?: string;
  
  xpValue: number;
  celebrationType: 'small' | 'medium' | 'large';
  
  parentTaskId?: string;
  subtasks?: Task[];
  position: number;
  
  addedBy?: string;
  assignedTo?: string;
  isShared: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: number[]; // For weekly: [1,3,5] = Mon, Wed, Fri
  endDate?: Date;
  skipHolidays?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  badgeTitle: string;
  badgeIcon: string;
  avatarUrl?: string;
  coupleId?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    taskReminders: boolean;
    dailyDigest: boolean;
    motivational: boolean;
    achievements: boolean;
    quietHours: {
      enabled: boolean;
      start: string; // "22:00"
      end: string;   // "07:00"
    };
  };
  sounds: {
    enabled: boolean;
    volume: number;
  };
  haptics: boolean;
  defaultView: 'today' | 'upcoming' | 'all';
  dateFormat: string;
  timeFormat: '12h' | '24h';
}
```

### API Examples

```typescript
// app/api/tasks/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get tasks
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  // AI parsing if natural language
  let parsedTask = body;
  if (body.naturalLanguage) {
    parsedTask = await parseTaskWithAI(body.input);
  }
  
  // Create task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      ...parsedTask,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ task }, { status: 201 });
}
```

### Performance Optimization

**1. Code Splitting:**
```typescript
// Lazy load heavy components
const InsightsDashboard = dynamic(() => import('@/components/InsightsDashboard'), {
  loading: () => <LoadingSkeleton />,
  ssr: false
});
```

**2. Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={48}
  height={48}
  loading="lazy"
/>
```

**3. Database Queries:**
```typescript
// Use indexes
// Limit data fetching
// Real-time subscriptions only where needed
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`
  }, handleTaskChange)
  .subscribe();
```

**4. Caching:**
```typescript
// React Query caching
const { data: tasks } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: fetchTasks,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Testing Strategy

**Unit Tests:**
```typescript
// __tests__/lib/calculateXP.test.ts
import { calculateXP } from '@/lib/gamification';

describe('calculateXP', () => {
  it('should calculate base XP for simple task', () => {
    const task = {
      duration: 30,
      priority: 'medium',
      subtasks: [],
    };
    expect(calculateXP(task)).toBe(10);
  });
  
  it('should apply bonus for urgent priority', () => {
    const task = {
      duration: 30,
      priority: 'urgent',
      subtasks: [],
    };
    expect(calculateXP(task)).toBe(15);
  });
});
```

**Integration Tests:**
```typescript
// __tests__/api/tasks.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/tasks/route';

describe('/api/tasks', () => {
  it('should create a task', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test task',
        category: 'work',
      },
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toHaveProperty('task');
  });
});
```

**E2E Tests (Playwright):**
```typescript
// e2e/task-creation.spec.ts
import { test, expect } from '@playwright/test';

test('user can create a task', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Login
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  // Create task
  await page.fill('[placeholder="What needs to be done?"]', 'Buy groceries');
  await page.press('[placeholder="What needs to be done?"]', 'Enter');
  
  // Verify
  await expect(page.locator('text=Buy groceries')).toBeVisible();
});
```

### Accessibility

**WCAG 2.1 AA Compliance:**

1. **Keyboard Navigation:**
   - All interactive elements focusable
   - Logical tab order
   - Keyboard shortcuts
   - Skip to content

2. **Screen Readers:**
   - Semantic HTML
   - ARIA labels
   - Live regions for dynamic content
   - Descriptive alt text

3. **Visual:**
   - Color contrast ratio > 4.5:1
   - No information by color alone
   - Scalable text
   - Focus indicators

4. **Motor:**
   - Large touch targets (44x44px min)
   - No time limits
   - Avoid rapid flashing

**Example:**
```tsx
<button
  onClick={handleComplete}
  aria-label={`Mark task "${task.title}" as complete`}
  className="min-w-[44px] min-h-[44px] focus:ring-2 focus:ring-primary"
>
  <CheckIcon className="w-6 h-6" aria-hidden="true" />
</button>
```

---

## 🎓 Learning Resources

### Next.js
- Official docs: https://nextjs.org/docs
- Learn Next.js: https://nextjs.org/learn

### TypeScript
- Handbook: https://www.typescriptlang.org/docs/
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app/

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- UI Patterns: https://tailwindui.com/components

### Framer Motion
- Docs: https://www.framer.com/motion/
- Examples: https://www.framer.com/motion/examples/

### Supabase
- Docs: https://supabase.com/docs
- Tutorial: https://supabase.com/docs/guides/getting-started

### PWA
- MDN Guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- next-pwa: https://github.com/shadowwalker/next-pwa

### DeepSeek AI
- API Docs: https://platform.deepseek.com/docs

---

## 💝 Final Notes

### Core Principles to Remember

1. **User First:** Every decision should make the app easier or more enjoyable for your wife
2. **Performance Matters:** Fast app = more usage
3. **Beauty in Details:** Small animations and transitions matter
4. **AI as Helper:** AI should feel like you're helping her, not a robot
5. **Celebrate Everything:** Make accomplishments visible and rewarding
6. **Zero Friction:** Every tap/click should feel effortless
7. **Privacy & Security:** Her data is sacred
8. **Iterate Based on Usage:** Watch how she uses it, adapt

### Success Metrics

**Engagement:**
- Daily active use
- Average tasks created per day
- Task completion rate
- Time spent in app
- Feature usage patterns

**Effectiveness:**
- Reduction in stress (self-reported)
- Task completion increase
- On-time completion rate
- Fewer rescheduled tasks
- Better work-life balance

**Satisfaction:**
- Positive emotional response
- Voluntary usage (not forced)
- Recommends to others
- Customizes app (categories, themes)
- Uses couple features

### Development Philosophy

**Start Simple, Iterate Fast:**
- MVP first, then enhance
- Ship features incrementally
- Get her feedback early and often
- Don't wait for perfection

**Measure Everything:**
- Add analytics from day 1
- Track user flows
- Monitor errors
- A/B test major changes

**Stay Focused:**
- One feature at a time
- Complete before moving on
- Quality over quantity
- Core experience first

**Have Fun:**
- This is a gift of love
- Enjoy the building process
- Celebrate your milestones too
- Make it yours together

---

## 📞 Support & Maintenance

### Monitoring

**Daily:**
- Check error logs (Sentry)
- Review analytics
- Monitor API usage
- Check notification delivery

**Weekly:**
- Review user feedback
- Analyze usage patterns
- Performance audit
- Security updates

**Monthly:**
- Feature usage analysis
- A/B test results
- Cost analysis (should be $0!)
- Backup verification

### Updating

**Dependencies:**
```bash
# Check for updates
npm outdated

# Update safely
npm update

# Major version updates
npm install package@latest
```

**Database Migrations:**
```sql
-- Always backup before migration
-- Test in development first
-- Run during low-usage times
```

**Feature Flags:**
- Test new features with flags
- Gradual rollout
- Easy rollback

### User Support

**Self-Service:**
- In-app help
- Tooltips
- Onboarding tutorial
- FAQ section

**Direct:**
- Feedback button in app
- Email support
- Bug reporting
- Feature requests

---

## 🎉 Conclusion

You now have a complete, professional-grade blueprint for building an exceptional to-do app for your wife. This documentation covers:

✅ Complete technical architecture
✅ Detailed design system
✅ Comprehensive feature list
✅ AI integration strategy
✅ Database schema
✅ Implementation roadmap
✅ Deployment guide
✅ Best practices
✅ Future enhancements

**Next Steps:**

1. Set up your development environment
2. Create Supabase project
3. Initialize Next.js project
4. Start with Phase 1 (Core MVP)
5. Get her feedback early
6. Iterate and improve
7. Launch and celebrate! 🎊

This app has the potential to:
- Make her daily life easier
- Reduce her stress
- Strengthen your relationship
- Showcase your technical skills
- Be genuinely enjoyable to use

Remember: The goal isn't perfection on day 1. The goal is to build something useful, beautiful, and made with love. Start simple, iterate based on her feedback, and enjoy the process!

Good luck! You've got this! 💪

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Author:** Built with love for your wife 💕
**License:** Personal Use Only

---

*P.S. When she loves it (and she will!), don't forget to celebrate that milestone too. Maybe add an achievement: "Made Partner Happy" 🎉*
