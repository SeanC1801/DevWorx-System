# DragonDrop
### Student-centric productivity dashboard with RPG progression and a pixel-art soul.

DragonDrop is a gamified task management system engineered for the specific workflow of students and developers. By merging a traditional time-block planner with RPG-style growth mechanics, the platform transforms the academic grind into a structured quest for consistency.

---

## Core Systems

### Task Engineering and Validation
The platform utilizes a **Schedule-to-Activate** model. Unlike standard to-do lists, tasks in DevWorx remain inactive until they are manually assigned to a specific Time Block. This enforces intentional planning over passive list-making.

* **Granular Difficulty:** Tasks are weighted by difficulty (Easy, Medium, Hard) and type (Academic, Goal, Personal).
* **Dynamic Rewards:** XP and Coin payouts are calculated based on punctuality. Completing a task within its scheduled block grants 100% rewards, while late completions incur a 50% penalty.
* **Undo/Refund Logic:** Integrated state management allows for the reversal of completions, accurately recalculating level progress and currency.

### The Time-Block Engine
Built on top of `@dnd-kit`, the central planner supports a high-friction drag-and-drop interface for precise scheduling.

* **Multi-Task Stacking:** Support for multiple entries per hour.
* **Contextual Scheduling:** Move tasks between the Brain Dump and the 24-hour rolling timeline.

### Dragon Evolution and Stats
A virtual mascot system that serves as a visual proxy for the user's productivity.

* **Stat Tracking:** The pet maintains its own Level, XP, Health, and Hunger.
* **Feedback Loops:** Meaningful task completion directly influences pet health and growth. Neglecting tasks results in hunger decay.
* **Growth Stages:** The pet evolves through four distinct visual phases as it reaches level milestones.

### Localized Economy: The Food Shop
The coin economy is tied to a Filipino-themed inventory system, allowing users to spend earned currency on cultural staples to maintain their pet's stats.

* **Inventory Management:** Items like Ilocos Empanada and Ice Scramble provide varying levels of Hunger restoration and Pet XP.
* **Stock Tracking:** Real-time inventory counters prevent over-purchasing and encourage strategic resource management.

---

## Technical Stack

* **Architecture:** TanStack Start v1 (React 19 with Server-Side Rendering)
* **Build Pipeline:** Vite 7
* **Styling Engine:** Tailwind CSS v4 using semantic tokens
* **State Management:** LocalStorage-backed unified store (`src/lib/devworx-store.ts`)
* **Component Library:** Headless shadcn/ui primitives with custom pixel-art CSS surfaces
* **Deployment:** Optimized for Edge Runtime (Cloudflare Workers)

---

## Development Setup

### System Requirements
* Bun (Recommended) or Node.js 20+

### Local Installation

```bash
# Clone the repository
git clone https://github.com/SeanC1801/DevWorx-System.git
cd DevWorx-System

# Install dependencies
bun install

# Launch development environment
bun run dev
```

The application will be served at `http://localhost:5173`.

---

## Project Structure

```text
src/
├── routes/
│   ├── __root.tsx        # Global layout and head metadata
│   └── index.tsx         # Main dashboard implementation
├── components/
│   ├── PixelAvatar.tsx   # Layered SVG character renderer
│   └── ui/               # Core UI primitives
├── lib/
│   ├── devworx-store.ts  # Unified application state
│   └── utils.ts          # Utility functions for date and XP math
└── styles.css            # Tailwind v4 tokens and pixel-border utility classes
```

---

## Game Mechanics

### XP and Ranking
Leveling follows a linear scale: `100 + level * 25`. Users progress through professional ranks, beginning as a **Code Novice** and scaling toward **Legendary Developer**.

### Clarity Metric
A real-time focus score that monitors system noise. The score increases through meaningful work and decreases if the Brain Dump exceeds 7 active items, simulating cognitive load.

---

## The DevWorx Team

* **Sean Caling** - Lead Developer and UI Architect
* **Mark Guevarra** - Systems Logic and Character Design
* **Nico Liwanag** - Documentation and Repository Management
* **Chasty Espinoza** - Quality Assurance and Data Strategy

---

## License
MIT - Created for the HackForAll Event.
