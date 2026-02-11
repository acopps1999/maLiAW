# Product Requirements Document: Valentine's Flashcard App

## 1. Overview

A lightweight web application that serves as a flashcard study tool for a law school student. The app features a novelty Valentine's Day-themed "login" gate before granting access to the core flashcard functionality. The app will be deployed on **Render** with **Supabase** as the backend database.

---

## 2. Goals

- Provide a simple, intuitive flashcard creation and study tool tailored for law school coursework.
- Deliver a memorable, humorous Valentine's Day experience through a fake login screen.
- Keep the tech stack minimal and the app easy to maintain as a solo-developer project.

---

## 3. User Persona

**Primary User:** A law school student who needs to create, organize, and review flashcards across multiple classes/subjects.

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) or Next.js |
| Backend / DB | Supabase (PostgreSQL + Auth/Storage) |
| Hosting | Render (Static Site or Web Service) |
| Styling | Tailwind CSS (or CSS of choice) |
| Media Storage | Supabase Storage (for the Valentine's GIF) |

---

## 5. Feature Requirements

### 5.1 Valentine's Day Login Gate

**Purpose:** A playful, non-functional "login" screen that acts as the entry point to the app. There are no real credentials — it simply asks the user to "Be My Valentine."

#### 5.1.1 Layout & UI

- Centered card/modal with a Valentine's Day aesthetic (hearts, pink/red color palette, playful typography).
- Headline text: *"Will You Be My Valentine?"* (or similar customizable message).
- Two buttons displayed: **"Yes"** and **"No"**.

#### 5.1.2 Interaction Logic

- **"Yes" Button:**
  - Remains stationary and clearly clickable.
  - On click → triggers the celebration sequence (see §5.1.3).

- **"No" Button:**
  - The "No" button **follows the user's mouse cursor** at all times, making it impossible to click.
  - Implementation: On `mousemove`, reposition the "No" button to stay near (but always just out of reach of) the cursor, OR have the "Yes" button magnetically follow the cursor so the user inevitably clicks it.
  - **Clarification on intended behavior:** Based on the request, the **"Yes" button tracks/follows the mouse cursor**, ensuring the user can only ever click "Yes." The "No" button can remain stationary or shrink/flee — the key constraint is that *clicking "No" is effectively impossible and clicking "Yes" is inevitable.*
  - On **mobile/touch devices:** The "No" button should jump to a random position on tap, preventing selection. The "Yes" button remains prominent and easily tappable.

#### 5.1.3 Celebration Sequence

1. User clicks **"Yes"**.
2. The screen transitions to a full-screen or centered display of a **celebration GIF** (to be uploaded by the developer later).
3. The GIF displays for exactly **5 seconds** (controlled via a `setTimeout`).
4. After 5 seconds, the user is automatically redirected/transitioned to the **Flashcard Dashboard** (§5.2).

#### 5.1.4 State Persistence

- Once the user has clicked "Yes," store a flag in `localStorage` so they are **not** shown the Valentine's gate on subsequent visits (they go straight to the dashboard).
- Optional: Include a way to reset/replay the Valentine's screen (e.g., a small hidden Easter egg link in the app footer).

---

### 5.2 Flashcard Dashboard (Home Screen)

**Purpose:** Central hub for managing all flashcard sets.

#### 5.2.1 UI Elements

- **Header/Nav Bar:** App name/logo, optional settings or theme toggle.
- **"Create New Set" Button:** Prominently displayed; opens the Set Creation view.
- **Flashcard Sets List:** Displays all existing sets as cards/tiles, each showing:
  - Set title
  - Number of cards in the set
  - Date created / last modified
  - **Edit** button → navigates to Set Editor (§5.3)
  - **Delete** button → triggers a confirmation dialog, then deletes the set and all associated cards

#### 5.2.2 Empty State

- If no sets exist, display a friendly empty-state message with a CTA to create the first set.

---

### 5.3 Flashcard Set Editor (Create & Edit)

**Purpose:** Interface for creating a new set or editing an existing set of flashcards.

#### 5.3.1 Set-Level Fields

- **Set Title** (required, text input): Name of the flashcard set (e.g., "Con Law — First Amendment").
- **Description** (optional, text input): Brief description or class name.

#### 5.3.2 Card Management

- Each card consists of two fields:
  - **Front** (term/question) — text input or textarea
  - **Back** (definition/answer) — text input or textarea
- **Add Card:** Button to append a new blank card to the set.
- **Delete Card:** Button on each card to remove it (with a brief confirmation or undo option).
- **Reorder Cards:** Optional drag-and-drop or up/down arrows to reorder cards within a set.

#### 5.3.3 Save Behavior

- **Save** button persists all changes to Supabase.
- Warn user if they attempt to navigate away with unsaved changes.

---

### 5.4 Flashcard Study Mode

**Purpose:** Allow the user to flip through and study the cards in a set.

#### 5.4.1 UI & Interaction

- Display one card at a time, showing the **front** by default.
- **Tap/Click to Flip:** Reveals the back of the card (use a flip animation for polish).
- **Next / Previous** navigation buttons (or swipe gestures on mobile).
- **Progress Indicator:** e.g., "Card 3 of 25."
- **Shuffle Option:** Button to randomize card order.

---

## 6. Data Model (Supabase)

### 6.1 `flashcard_sets` Table

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `title` | `text` | Not null |
| `description` | `text` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()`, updated on modify |

### 6.2 `flashcards` Table

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `set_id` | `uuid` | Foreign key → `flashcard_sets.id`, on delete cascade |
| `front` | `text` | Not null |
| `back` | `text` | Not null |
| `position` | `integer` | For ordering within a set |
| `created_at` | `timestamptz` | Default `now()` |

> **Note:** Since there is only one user and no real authentication, no `user_id` column is needed. If multi-user support is ever desired, add a `user_id` foreign key to `flashcard_sets`.

---

## 7. API / Data Access Layer

All data access will go through the **Supabase JavaScript client** (`@supabase/supabase-js`). No custom backend API is required.

### Key Operations

| Operation | Method |
|---|---|
| Fetch all sets | `supabase.from('flashcard_sets').select('*, flashcards(count)')` |
| Fetch single set + cards | `supabase.from('flashcard_sets').select('*, flashcards(*)').eq('id', setId)` |
| Create set | `supabase.from('flashcard_sets').insert({ title, description })` |
| Update set | `supabase.from('flashcard_sets').update({ title, description }).eq('id', setId)` |
| Delete set | `supabase.from('flashcard_sets').delete().eq('id', setId)` |
| Add card(s) | `supabase.from('flashcards').insert([{ set_id, front, back, position }])` |
| Update card | `supabase.from('flashcards').update({ front, back }).eq('id', cardId)` |
| Delete card | `supabase.from('flashcards').delete().eq('id', cardId)` |

---

## 8. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Performance** | Page loads under 2 seconds; flashcard flip transitions feel instant. |
| **Responsiveness** | Fully usable on desktop and mobile (phone/tablet). |
| **Browser Support** | Chrome, Safari, Firefox (latest versions). |
| **Accessibility** | Basic a11y — keyboard navigation for flashcard study, readable contrast ratios. |
| **Data Safety** | Supabase Row Level Security (RLS) policies should be configured. Even without auth, restrict operations to the app's anon key scope. |

---

## 9. Pages / Route Structure

| Route | View |
|---|---|
| `/` | Valentine's Login Gate (or redirect to `/dashboard` if already accepted) |
| `/dashboard` | Flashcard Sets Dashboard |
| `/sets/new` | Create New Set |
| `/sets/:id/edit` | Edit Existing Set |
| `/sets/:id/study` | Study Mode for a Set |

---

## 10. Deployment Plan

1. **Supabase Setup:**
   - Create project and provision database.
   - Create `flashcard_sets` and `flashcards` tables per §6.
   - Configure RLS policies.
   - Upload celebration GIF to Supabase Storage (or host statically).

2. **Frontend Build:**
   - Scaffold project with Vite + React (or Next.js).
   - Implement Valentine's gate → Dashboard → Set Editor → Study Mode.
   - Connect to Supabase via client SDK.

3. **Render Deployment:**
   - Connect GitHub repo to Render.
   - Deploy as a **Static Site** (if pure SPA) or **Web Service** (if using SSR/Next.js).
   - Set environment variables for Supabase URL and anon key.

---

## 11. Future Enhancements (Out of Scope for V1)

- User authentication (real login for multi-user support).
- Spaced repetition algorithm (SM-2) for smarter study sessions.
- Card tagging or categorization within a set.
- Import/export flashcards (CSV, Anki format).
- Rich text or image support on card faces.
- Dark mode toggle.
- Search/filter across all sets and cards.

---

## 12. Success Criteria

1. Girlfriend clicks "Yes" (100% conversion rate expected).
2. She can independently create, edit, delete, and study flashcard sets without assistance.
3. The app remains stable and usable throughout the semester.
