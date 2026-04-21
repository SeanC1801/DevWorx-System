// Lightweight localStorage state for DevWorx
// Single source of truth for tasks, blocks, stats, theme, pet, history.
import { useEffect, useState, useCallback } from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type Value = "goal" | "academic" | "personal";
// Category color tag for visual grouping in time blocks (independent of value)
export type CategoryTag = "none" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink";

/** Pet food shop item ids. */
export type FoodId =
  | "ilocos_empanada"
  | "dubai_chocolate"
  | "siomai_stick"
  | "ice_scramble"
  | "matcha"
  | "assignment_book";

export interface FoodItem {
  id: FoodId;
  name: string;
  price: number;
  /** Hunger restored (reduces hunger meter). */
  hungerRestore: number;
  /** Pet XP gained on feed. */
  petXp: number;
  /** Emoji used as a pixel-style icon. */
  emoji: string;
}

export const FOOD_SHOP: FoodItem[] = [
  { id: "ilocos_empanada", name: "Ilocos Empanada",     price: 20, hungerRestore: 25, petXp: 10, emoji: "🥟" },
  { id: "dubai_chocolate", name: "Dubai Chewy Choco",   price: 30, hungerRestore: 35, petXp: 16, emoji: "🍫" },
  { id: "siomai_stick",    name: "3pc Siomai Stick",    price: 15, hungerRestore: 20, petXp: 8,  emoji: "🍡" },
  { id: "ice_scramble",    name: "Ice Scramble",        price: 20, hungerRestore: 22, petXp: 9,  emoji: "🍧" },
  { id: "matcha",          name: "Chello Matcha",       price: 30, hungerRestore: 30, petXp: 14, emoji: "🍵" },
  { id: "assignment_book", name: "Assignment Book",     price: 5,  hungerRestore: 8,  petXp: 4,  emoji: "📕" },
];

export type FoodInventory = Partial<Record<FoodId, number>>;

/** Coins awarded per difficulty. */
export function coinsFor(difficulty: Difficulty): number {
  return difficulty === "hard" ? 10 : difficulty === "medium" ? 5 : 2;
}

export interface Task {
  id: string;
  title: string;
  difficulty: Difficulty;
  value: Value;
  done: boolean;
  eliminated: boolean;
  scheduled: boolean; // true once placed in a time block
  createdAt: number;
  /** Date (YYYY-MM-DD) of the FIRST scheduled block. Used to detect on-time vs late. */
  scheduledDate?: string;
  /** Earliest scheduled hour on scheduledDate. Used to detect on-time vs late. */
  scheduledHour?: number;
  /** XP that was awarded on completion (so we can subtract on undo). */
  awardedXp?: number;
  /** Coins that were awarded on completion (so we can subtract on undo). */
  awardedCoins?: number;
  /** Optional category color tag shown in time blocks. */
  category?: CategoryTag;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  hour: number; // 0–23, start hour
  duration: number; // hours
  date: string; // YYYY-MM-DD
}

export interface DayQuality {
  date: string;
  meaningful: number;
  low: number;
  eliminated: number;
}

export type ClassEntryType = "class" | "lab" | "break";
export interface ClassEntry {
  id: string;
  time: string;
  subject: string;
  type: ClassEntryType;
}
export type ClassSchedule = Record<number, ClassEntry[]>;

export interface DevWorxState {
  theme: "light" | "dark";
  username: string;
  avatarId: string;
  dragonId: string;
  /** Stardew-style customizable pixel avatar (non-overlapping single-layer choices). */
  pixelAvatar: {
    skin: string;     // hex
    hair: string;     // hairstyle id
    hairColor: string;
    shirt: string;    // shirt color hex
    accessory: string; // accessory id ("none" | "glasses" | "headband" | "earring")
  };
  level: number;
  xp: number;
  hp: number;
  life: number;
  clarity: number;
  tasks: Task[];
  blocks: TimeBlock[];
  history: DayQuality[];
  lastLevelUp: number;
  classSchedule: ClassSchedule;
  coins: number;
  foodInventory: FoodInventory;
  pet: {
    name: string;
    xp: number;
    level: number;
    health: number;
    hunger: number;
    weakness: number;
    stage: "egg" | "hatchling" | "growing" | "awakened";
  };
}

const RANKS = [
  "Code Novice","Bug Hunter","Script Kiddie","Code Warrior","Algorithm Knight",
  "Syntax Sage","Debug Master","Code Architect","Compiler Wizard","Legendary Dev",
];

export function rankForLevel(level: number): string {
  return RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))];
}

export function valueLabel(v: Value): string {
  return v === "goal" ? "Aligns with goal" : v === "academic" ? "Academic" : "Personal";
}

export function isMeaningfulValue(v: Value): boolean {
  return v === "goal" || v === "academic";
}

/** Base XP per difficulty (no value/scheduling multipliers — simpler "Schedule-to-Activate" model). */
export function baseXpFor(difficulty: Difficulty): number {
  return difficulty === "hard" ? 100 : difficulty === "medium" ? 60 : 30;
}

/** Color hex per difficulty for badges/borders. */
export function difficultyColor(d: Difficulty): string {
  return d === "hard" ? "#DE3335" : d === "medium" ? "#FACC15" : "#22C55E";
}

const KEY = "devworx-state-v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seedHistory(): DayQuality[] {
  const out: DayQuality[] = [];
  const now = new Date();
  for (let i = 48; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), meaningful: 0, low: 0, eliminated: 0 });
  }
  return out;
}

const DEFAULT_CLASS_SCHEDULE: ClassSchedule = {
  0: [],
  1: [
    { id: "mon-1", time: "8:30 – 10:00 AM", subject: "Discrete Structures", type: "class" },
    { id: "mon-2", time: "10:00 – 11:30 AM", subject: "Intermediate Programming", type: "class" },
    { id: "mon-3", time: "11:30 – 12:30 PM", subject: "Lunch Break", type: "break" },
    { id: "mon-4", time: "12:30 – 2:00 PM", subject: "Advanced Statistics", type: "class" },
    { id: "mon-5", time: "2:00 – 4:00 PM", subject: "Intermediate Programming (Lab)", type: "lab" },
  ],
  2: [
    { id: "tue-1", time: "8:30 – 10:00 AM", subject: "Advanced Statistics", type: "class" },
    { id: "tue-2", time: "10:00 – 11:30 AM", subject: "Discrete Structures", type: "class" },
    { id: "tue-3", time: "11:30 – 12:30 PM", subject: "Lunch Break", type: "break" },
    { id: "tue-4", time: "12:30 – 2:30 PM", subject: "Advanced Statistics (Lab)", type: "lab" },
    { id: "tue-5", time: "2:30 – 4:00 PM", subject: "Intermediate Programming", type: "class" },
  ],
  3: [
    { id: "wed-1", time: "8:30 – 10:00 AM", subject: "Discrete Structures", type: "class" },
    { id: "wed-2", time: "10:00 – 11:30 AM", subject: "Intermediate Programming", type: "class" },
    { id: "wed-3", time: "11:30 – 12:30 PM", subject: "Lunch Break", type: "break" },
    { id: "wed-4", time: "12:30 – 2:00 PM", subject: "Advanced Statistics", type: "class" },
    { id: "wed-5", time: "2:00 – 4:00 PM", subject: "Intermediate Programming (Lab)", type: "lab" },
  ],
  4: [
    { id: "thu-1", time: "8:30 – 10:00 AM", subject: "Advanced Statistics", type: "class" },
    { id: "thu-2", time: "10:00 – 11:30 AM", subject: "Discrete Structures", type: "class" },
    { id: "thu-3", time: "11:30 – 12:30 PM", subject: "Lunch Break", type: "break" },
    { id: "thu-4", time: "12:30 – 2:30 PM", subject: "Advanced Statistics (Lab)", type: "lab" },
    { id: "thu-5", time: "2:30 – 4:00 PM", subject: "Intermediate Programming", type: "class" },
  ],
  5: [
    { id: "fri-1", time: "8:30 – 10:00 AM", subject: "Discrete Structures", type: "class" },
    { id: "fri-2", time: "10:00 – 11:30 AM", subject: "Intermediate Programming", type: "class" },
    { id: "fri-3", time: "11:30 – 12:30 PM", subject: "Lunch Break", type: "break" },
    { id: "fri-4", time: "12:30 – 2:00 PM", subject: "Advanced Statistics", type: "class" },
  ],
  6: [],
};

const DEFAULT_STATE: DevWorxState = {
  theme: "dark",
  username: "Sean Caling",
  avatarId: "avatar-1",
  dragonId: "dragon-red",
  pixelAvatar: {
    skin: "#F1C27D",
    hair: "short",
    hairColor: "#2B1B0E",
    shirt: "#DE3335",
    accessory: "none",
  },
  level: 1,
  xp: 0,
  hp: 100,
  life: 5,
  clarity: 60,
  tasks: [],
  blocks: [],
  history: seedHistory(),
  lastLevelUp: 0,
  classSchedule: DEFAULT_CLASS_SCHEDULE,
  coins: 0,
  foodInventory: {},
  pet: {
    name: "Ember",
    xp: 0,
    level: 1,
    health: 80,
    hunger: 30,
    weakness: 20,
    stage: "hatchling",
  },
};

function load(): DevWorxState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as DevWorxState;
    if (Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.map((t) => {
        const v = t.value as unknown as string;
        if (v === "supports") return { ...t, value: "goal" as Value };
        if (v === "low") return { ...t, value: "personal" as Value };
        return t;
      });
    }
    const t = todayKey();
    if (!parsed.history?.some((h) => h.date === t)) {
      parsed.history = [...(parsed.history || seedHistory()), { date: t, meaningful: 0, low: 0, eliminated: 0 }];
      if (parsed.history.length > 49) parsed.history = parsed.history.slice(-49);
    }
    const merged = { ...DEFAULT_STATE, ...parsed };
    merged.pet = { ...DEFAULT_STATE.pet, ...(parsed.pet || {}) };
    return merged;
  } catch {
    return DEFAULT_STATE;
  }
}

function save(state: DevWorxState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function useDevWorx() {
  const [state, setState] = useState<DevWorxState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setState(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) save(state); }, [state, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (state.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [state.theme, hydrated]);

  const update = useCallback((updater: (s: DevWorxState) => DevWorxState) => {
    setState((prev) => updater(prev));
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => update((s) => ({ ...s, theme })), [update]);
  const setUsername = useCallback((username: string) => update((s) => ({ ...s, username })), [update]);
  const setAvatarId = useCallback((avatarId: string) => update((s) => ({ ...s, avatarId })), [update]);
  const setDragonId = useCallback((dragonId: string) => update((s) => ({ ...s, dragonId })), [update]);

  const setPixelAvatar = useCallback(
    (patch: Partial<DevWorxState["pixelAvatar"]>) =>
      update((s) => ({ ...s, pixelAvatar: { ...s.pixelAvatar, ...patch } })),
    [update],
  );

  const addTask = useCallback((t: Omit<Task, "id" | "done" | "eliminated" | "scheduled" | "createdAt">) => {
    update((s) => {
      const newTask: Task = {
        ...t,
        id: crypto.randomUUID(),
        done: false,
        eliminated: false,
        scheduled: false,
        createdAt: Date.now(),
        category: t.category ?? "none",
      };
      const activeCount = s.tasks.filter((x) => !x.done && !x.eliminated).length + 1;
      const clarityDelta = activeCount > 7 ? -3 : 0;
      return { ...s, tasks: [newTask, ...s.tasks], clarity: clamp(s.clarity + clarityDelta, 0, 100) };
    });
  }, [update]);

  const setTaskCategory = useCallback((id: string, category: CategoryTag) => {
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, category } : t)) }));
  }, [update]);

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, "title" | "difficulty" | "value" | "category">>) => {
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
    },
    [update],
  );

  const eliminateTask = useCallback((id: string) => {
    update((s) => {
      const tasks = s.tasks.map((t) => (t.id === id ? { ...t, eliminated: true } : t));
      const blocks = s.blocks.filter((b) => b.taskId !== id);
      const history = bumpToday(s.history, { eliminated: 1 });
      return { ...s, tasks, blocks, clarity: clamp(s.clarity + 5, 0, 100), history };
    });
  }, [update]);

  const deleteTask = useCallback((id: string) => {
    update((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
      blocks: s.blocks.filter((b) => b.taskId !== id),
    }));
  }, [update]);

  /** Toggle complete with on-time / late XP and undo. */
  const toggleComplete = useCallback((id: string) => {
    update((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return s;

      // ----- UNDO path: restore by subtracting awarded XP -----
      if (task.done) {
        const award = task.awardedXp ?? 0;
        const coinAward = task.awardedCoins ?? 0;
        let xp = s.xp - award;
        let level = s.level;
        // walk back levels if needed
        while (xp < 0 && level > 1) {
          level -= 1;
          xp += 100 + level * 25;
        }
        if (xp < 0) xp = 0;
        const coins = Math.max(0, s.coins - coinAward);
        return {
          ...s,
          xp,
          level,
          coins,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: false, awardedXp: 0 } : t)),
        };
      }

      // ----- COMPLETE path: requires task to be scheduled -----
      if (!task.scheduled || !task.scheduledDate) {
        return s; // safety: should be gated by UI
      }

      // On-time = checked any time from block start until end of scheduled calendar day.
      const today = todayKey();
      const onTime = today <= task.scheduledDate;
      const base = baseXpFor(task.difficulty);
      const gained = onTime ? base : Math.round(base * 0.5);
      const coinGain = onTime ? coinsFor(task.difficulty) : Math.max(1, Math.round(coinsFor(task.difficulty) * 0.5));

      let xp = s.xp + gained;
      let level = s.level;
      let lastLevelUp = s.lastLevelUp;
      let xpToLevel = 100 + level * 25;
      while (xp >= xpToLevel) {
        xp -= xpToLevel;
        level += 1;
        lastLevelUp = Date.now();
        xpToLevel = 100 + level * 25;
      }

      const meaningful = isMeaningfulValue(task.value);
      const clarity = clamp(s.clarity + (meaningful ? 4 : -2), 0, 100);
      const pet = { ...s.pet };
      if (meaningful) {
        pet.xp = clamp(pet.xp + 18, 0, 100);
        pet.health = clamp(pet.health + 4, 0, 100);
        pet.hunger = clamp(pet.hunger - 6, 0, 100);
      } else {
        pet.xp = clamp(pet.xp + 4, 0, 100);
      }
      if (pet.xp >= 100) {
        pet.xp = 0;
        pet.stage = pet.stage === "egg" ? "hatchling" : pet.stage === "hatchling" ? "growing" : "awakened";
      }

      const history = bumpToday(s.history, meaningful ? { meaningful: 1 } : { low: 1 });

      return {
        ...s,
        xp,
        level,
        lastLevelUp,
        clarity,
        pet,
        history,
        coins: s.coins + coinGain,
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, done: true, awardedXp: gained, awardedCoins: coinGain } : t,
        ),
      };
    });
  }, [update]);

  /** Add a single block (supports many tasks per hour AND a single task across many blocks). */
  const scheduleTask = useCallback((taskId: string, hour: number, duration = 1, date?: string) => {
    update((s) => {
      const d = date ?? todayKey();
      // Avoid exact duplicate (same task, same hour, same date)
      const exists = s.blocks.some((b) => b.taskId === taskId && b.hour === hour && b.date === d);
      const blocks = exists
        ? s.blocks
        : [...s.blocks, { id: crypto.randomUUID(), taskId, hour, duration, date: d }];

      // Track earliest scheduled (date, hour) for on-time/late logic
      const taskBlocks = blocks.filter((b) => b.taskId === taskId);
      let earliestDate = d;
      let earliestHour = hour;
      for (const b of taskBlocks) {
        if (b.date < earliestDate || (b.date === earliestDate && b.hour < earliestHour)) {
          earliestDate = b.date;
          earliestHour = b.hour;
        }
      }
      return {
        ...s,
        blocks,
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, scheduled: true, scheduledDate: earliestDate, scheduledHour: earliestHour }
            : t,
        ),
      };
    });
  }, [update]);

  const unscheduleBlock = useCallback((blockId: string) => {
    update((s) => {
      const block = s.blocks.find((b) => b.id === blockId);
      if (!block) return s;
      const blocks = s.blocks.filter((b) => b.id !== blockId);
      const remaining = blocks.filter((b) => b.taskId === block.taskId);
      const stillScheduled = remaining.length > 0;
      let earliestDate: string | undefined;
      let earliestHour: number | undefined;
      for (const b of remaining) {
        if (!earliestDate || b.date < earliestDate || (b.date === earliestDate && b.hour < (earliestHour ?? 24))) {
          earliestDate = b.date;
          earliestHour = b.hour;
        }
      }
      return {
        ...s,
        blocks,
        tasks: s.tasks.map((t) =>
          t.id === block.taskId
            ? { ...t, scheduled: stillScheduled, scheduledDate: earliestDate, scheduledHour: earliestHour }
            : t,
        ),
      };
    });
  }, [update]);

  const feedPet = useCallback(() => {
    update((s) => ({
      ...s,
      pet: {
        ...s.pet,
        hunger: clamp(s.pet.hunger - 30, 0, 100),
        health: clamp(s.pet.health + 10, 0, 100),
      },
    }));
  }, [update]);

  const buyFood = useCallback((foodId: FoodId) => {
    update((s) => {
      const item = FOOD_SHOP.find((f) => f.id === foodId);
      if (!item) return s;
      if (s.coins < item.price) return s;
      const current = s.foodInventory[foodId] ?? 0;
      return {
        ...s,
        coins: s.coins - item.price,
        foodInventory: { ...s.foodInventory, [foodId]: current + 1 },
      };
    });
  }, [update]);

  const feedPetWithFood = useCallback((foodId: FoodId) => {
    update((s) => {
      const item = FOOD_SHOP.find((f) => f.id === foodId);
      if (!item) return s;
      const stock = s.foodInventory[foodId] ?? 0;
      if (stock <= 0) return s;
      const pet = { ...s.pet };
      pet.hunger = clamp(pet.hunger - item.hungerRestore, 0, 100);
      pet.health = clamp(pet.health + 4, 0, 100);
      pet.xp = clamp(pet.xp + item.petXp, 0, 100);
      if (pet.xp >= 100) {
        pet.xp = 0;
        pet.stage = pet.stage === "egg" ? "hatchling" : pet.stage === "hatchling" ? "growing" : "awakened";
      }
      return {
        ...s,
        pet,
        foodInventory: { ...s.foodInventory, [foodId]: stock - 1 },
      };
    });
  }, [update]);

  const addClassEntry = useCallback((day: number, entry: Omit<ClassEntry, "id">) => {
    update((s) => {
      const list = s.classSchedule[day] ?? [];
      const newEntry: ClassEntry = { ...entry, id: crypto.randomUUID() };
      return { ...s, classSchedule: { ...s.classSchedule, [day]: [...list, newEntry] } };
    });
  }, [update]);

  const updateClassEntry = useCallback((day: number, id: string, patch: Partial<Omit<ClassEntry, "id">>) => {
    update((s) => {
      const list = (s.classSchedule[day] ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e));
      return { ...s, classSchedule: { ...s.classSchedule, [day]: list } };
    });
  }, [update]);

  const removeClassEntry = useCallback((day: number, id: string) => {
    update((s) => {
      const list = (s.classSchedule[day] ?? []).filter((e) => e.id !== id);
      return { ...s, classSchedule: { ...s.classSchedule, [day]: list } };
    });
  }, [update]);

  return {
    state,
    hydrated,
    setTheme,
    setUsername,
    setAvatarId,
    setDragonId,
    setPixelAvatar,
    addTask,
    updateTask,
    setTaskCategory,
    eliminateTask,
    deleteTask,
    completeTask: toggleComplete, // back-compat alias
    toggleComplete,
    scheduleTask,
    unscheduleBlock,
    feedPet,
    buyFood,
    feedPetWithFood,
    addClassEntry,
    updateClassEntry,
    removeClassEntry,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bumpToday(history: DayQuality[], delta: Partial<Pick<DayQuality, "meaningful" | "low" | "eliminated">>) {
  const t = todayKey();
  const next = history.map((h) =>
    h.date === t
      ? {
          ...h,
          meaningful: h.meaningful + (delta.meaningful || 0),
          low: h.low + (delta.low || 0),
          eliminated: h.eliminated + (delta.eliminated || 0),
        }
      : h,
  );
  if (!next.some((h) => h.date === t)) {
    next.push({ date: t, meaningful: delta.meaningful || 0, low: delta.low || 0, eliminated: delta.eliminated || 0 });
  }
  return next.slice(-49);
}

export function dayQualityColor(d: DayQuality): "good" | "mixed" | "bad" | "none" {
  const total = d.meaningful + d.low;
  if (total === 0 && d.eliminated === 0) return "none";
  if (d.meaningful >= 2 && d.low <= d.meaningful / 2) return "good";
  if (d.low > d.meaningful) return "bad";
  return "mixed";
}

/** CSS color (with optional text contrast helper) for a CategoryTag. */
export const CATEGORY_COLORS: Record<CategoryTag, { bg: string; ring: string; label: string }> = {
  none:   { bg: "transparent", ring: "transparent", label: "None" },
  red:    { bg: "#DE3335",     ring: "#DE3335",     label: "Red" },
  orange: { bg: "#F97316",     ring: "#F97316",     label: "Orange" },
  yellow: { bg: "#FACC15",     ring: "#FACC15",     label: "Yellow" },
  green:  { bg: "#22C55E",     ring: "#22C55E",     label: "Green" },
  blue:   { bg: "#3B82F6",     ring: "#3B82F6",     label: "Blue" },
  purple: { bg: "#A855F7",     ring: "#A855F7",     label: "Purple" },
  pink:   { bg: "#EC4899",     ring: "#EC4899",     label: "Pink" },
};
