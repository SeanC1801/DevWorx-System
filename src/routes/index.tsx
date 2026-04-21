import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Users,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  X,
  Check,
  Sparkles,
  Sun,
  Moon,
  Flame,
  Target,
  Brain,
  Calendar as CalendarIcon,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Tag,
  Pencil,
  Coins,
} from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useDevWorx,
  dayQualityColor,
  difficultyColor,
  baseXpFor,
  CATEGORY_COLORS,
  coinsFor,
  FOOD_SHOP,
  type Task,
  type Difficulty,
  type Value,
  type CategoryTag,
  type FoodId,
} from "@/lib/devworx-store";
import dragonDefault from "@/assets/dragon-mascot.png";
import dragonRed from "@/assets/dragon-red.png";
import dragonBlue from "@/assets/dragon-blue.png";
import dragonGreen from "@/assets/dragon-green.png";
import dragonPurple from "@/assets/dragon-purple.png";
import avatarDefault from "@/assets/pixel-avatar.png";
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";
import auLogo from "@/assets/au-logo.png";
import marioBg from "@/assets/mario-bg.jpg";
import {
  PixelAvatar,
  HAIR_STYLES,
  HAIR_COLORS,
  SKIN_TONES,
  SHIRT_COLORS,
  ACCESSORIES,
} from "@/components/PixelAvatar";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DevWorx — CCS College of Computer Studies" },
      {
        name: "description",
        content:
          "Gamified focus system for CCS students. Plan your to-do list, lock it into time blocks, and grow your dragon companion.",
      },
    ],
  }),
});

type Tab = "home" | "dragon" | "friends" | "settings";

/* ---------------- Asset registries (used by Settings selectors) ---------------- */
export const AVATARS: { id: string; src: string; label: string }[] = [
  { id: "avatar-default", src: avatarDefault, label: "Classic" },
  { id: "avatar-1", src: avatar1, label: "Red Hoodie" },
  { id: "avatar-2", src: avatar2, label: "Glasses" },
  { id: "avatar-3", src: avatar3, label: "Headphones" },
  { id: "avatar-4", src: avatar4, label: "Pink Hair" },
];
export const DRAGONS: { id: string; src: string; label: string }[] = [
  { id: "dragon-default", src: dragonDefault, label: "Original" },
  { id: "dragon-red", src: dragonRed, label: "Ember (Fire)" },
  { id: "dragon-blue", src: dragonBlue, label: "Aqua (Water)" },
  { id: "dragon-green", src: dragonGreen, label: "Sylph (Forest)" },
  { id: "dragon-purple", src: dragonPurple, label: "Umbra (Shadow)" },
];

function avatarSrc(id: string) {
  return AVATARS.find((a) => a.id === id)?.src ?? avatar1;
}
function dragonSrc(id: string) {
  return DRAGONS.find((d) => d.id === id)?.src ?? dragonRed;
}

/* ---------------- Selected-date context (shared across panels) ---------------- */
function useSelectedDate() {
  const [date, setDate] = useState<Date>(() => new Date());
  return { date, setDate };
}
function dateKey(d: Date) {
  // Local-date YYYY-MM-DD (avoid UTC drift)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function Index() {
  const dw = useDevWorx();
  const [tab, setTab] = useState<Tab>("home");
  const sel = useSelectedDate();

  if (!dw.hydrated) return <div className="min-h-screen bg-background" />;

  return (
    <div
      className="mario-bg relative min-h-screen text-foreground"
      style={{
        backgroundImage: `url(${marioBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative z-20 mx-auto flex min-h-screen max-w-[1400px] flex-col px-[30px] pb-10 pt-[20px]">
        <TopNav tab={tab} setTab={setTab} />
        <div className="relative z-30 mt-4">
          {tab === "dragon" ? <MainHeader dw={dw} /> : <HomeHeader dw={dw} />}
        </div>
        <main className="animate-pop relative z-10 mt-[24px] flex-1">
          {tab === "home" && <HomeTab dw={dw} selectedDate={sel.date} setSelectedDate={sel.setDate} />}
          {tab === "dragon" && <DragonTab dw={dw} />}
          {tab === "friends" && <FriendsTab />}
          {tab === "settings" && <SettingsTab dw={dw} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Main header (unchanged — used on Dragon tab) ---------------- */
function MainHeader({ dw }: { dw: ReturnType<typeof useDevWorx> }) {
  const { state } = dw;
  const hp = Math.max(0, Math.min(100, state.hp ?? 100));

  return (
    <header className="surface-card ring-soft relative flex items-center gap-4 bg-card px-4 py-3 md:px-6 md:py-3 overflow-visible">
      <div className="flex shrink-0 items-center gap-3 z-10">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border-2 border-primary bg-surface-2 shadow-[0_0_10px_var(--color-primary)] flex items-center justify-center">
          <PixelAvatar spec={state.pixelAvatar} size={52} />
        </div>
        <div className="flex flex-col gap-1 leading-tight min-w-[160px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{state.username}</span>
            <span className="font-pixel text-[10px] text-primary drop-shadow-[0_0_4px_var(--color-primary)]">
              LVL {state.level}
            </span>
          </div>
          <div className="hp-bar relative h-3 w-full overflow-hidden rounded-full">
            <div className="hp-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out" style={{ width: `${hp}%` }} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-pixel text-[7px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                HP {Math.round(hp)}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center px-4">
        <h1
          className="font-pixel text-center leading-none text-[22px] sm:text-[28px] md:text-[34px]"
          style={{
            WebkitTextStroke: "2px #000",
            fontWeight: 900,
            textShadow:
              "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 1px 0 0 currentColor, -1px 0 0 currentColor",
          }}
        >
          <span style={{ color: "var(--color-primary)" }}>DRAGON</span>
          <span style={{ color: "#FFFFFF" }}>DROP</span>
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center z-10">
        <img
          src={dragonSrc(state.dragonId)}
          alt="dragon"
          className="pixelated h-20 w-20 animate-floaty object-contain drop-shadow-[0_0_14px_var(--color-primary)] sm:h-24 sm:w-24"
          style={{ marginTop: "-1.5rem", marginBottom: "-1.5rem" }}
        />
      </div>
    </header>
  );
}

/* ---------------- Home header — UNCHANGED design (per critical constraint) ---------------- */
function HomeHeader({ dw }: { dw: ReturnType<typeof useDevWorx> }) {
  const { state } = dw;
  const hp = Math.max(0, Math.min(100, state.hp ?? 100));
  const xpToLevel = 100 + state.level * 25;
  const xpPct = Math.max(0, Math.min(100, (state.xp / xpToLevel) * 100));

  return (
    <header className="surface-card ring-soft relative flex items-center gap-4 bg-card px-4 py-3 md:px-6 md:py-3 overflow-visible">
      <div className="flex shrink-0 items-center gap-3 z-10">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border-2 border-primary bg-surface-2 shadow-[0_0_10px_var(--color-primary)] flex items-center justify-center">
          <PixelAvatar spec={state.pixelAvatar} size={52} />
        </div>
        <div className="flex flex-col gap-1 leading-tight min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{state.username}</span>
            <span className="font-pixel text-[10px] text-primary drop-shadow-[0_0_4px_var(--color-primary)]">
              LVL {state.level}
            </span>
          </div>
          <div className="hp-bar relative h-3 w-full overflow-hidden rounded-full">
            <div className="hp-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out" style={{ width: `${hp}%` }} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-pixel text-[7px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                HP {Math.round(hp)}/100
              </span>
            </div>
          </div>
          <div className="exp-bar relative h-2.5 w-full overflow-hidden">
            <div className="xp-fill absolute inset-y-0 left-0 transition-[width] duration-500 ease-out" style={{ width: `${xpPct}%` }} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-pixel text-[6px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">
                EXP {state.xp}/{xpToLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center px-4">
        <h1
          className="font-pixel text-center leading-none text-[22px] sm:text-[28px] md:text-[34px]"
          style={{
            WebkitTextStroke: "2px #000",
            fontWeight: 900,
            textShadow:
              "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 1px 0 0 currentColor, -1px 0 0 currentColor",
          }}
        >
          <span style={{ color: "var(--color-primary)" }}>DRAGON</span>
          <span style={{ color: "#FFFFFF" }}>DROP</span>
        </h1>
      </div>

      <div className="ml-auto flex shrink-0 items-end z-20 self-stretch">
        <img
          src={dragonSrc(state.dragonId)}
          alt="dragon"
          className="pixelated animate-floaty object-contain drop-shadow-[0_0_18px_var(--color-primary)] h-[140px] w-[140px] sm:h-[170px] sm:w-[170px] md:h-[190px] md:w-[190px]"
          style={{ marginTop: "-70px", marginBottom: "-70px", marginRight: "-10px" }}
        />
      </div>
    </header>
  );
}

/* ---------------- Home tab ---------------- */
function HomeTab({
  dw,
  selectedDate,
  setSelectedDate,
}: {
  dw: ReturnType<typeof useDevWorx>;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}) {
  const { state, scheduleTask } = dw;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const dKey = dateKey(selectedDate);

  function onDragEnd(e: DragEndEvent) {
    const taskId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId || !overId.startsWith("hour-")) return;
    const hour = parseInt(overId.replace("hour-", ""), 10);
    scheduleTask(taskId, hour, 1, dKey);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-5 lg:h-[calc(100vh-300px)] lg:grid-cols-[1fr_1.3fr_1fr] lg:gap-x-6">
        <ToDoList dw={dw} />
        <TimeBlocking dw={dw} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <aside className="surface-card ring-soft flex min-h-0 flex-col gap-5 p-5 lg:h-full lg:overflow-y-auto">
          <ScheduleEditorMinimal dw={dw} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          <HeatmapCard history={state.history} />
        </aside>
      </div>
      <OverloadWarning count={state.tasks.filter((t) => !t.done && !t.eliminated).length} />
    </DndContext>
  );
}

/* ---------------- Class Schedule (right sidebar — fully editable, persistent) ---------------- */
function ScheduleEditorMinimal({
  dw,
  selectedDate,
}: {
  dw: ReturnType<typeof useDevWorx>;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}) {
  const { state, addClassEntry, updateClassEntry, removeClassEntry } = dw;
  const dayOfWeek = selectedDate.getDay();
  const classes = state.classSchedule[dayOfWeek] ?? [];
  const dayName = selectedDate.toLocaleDateString(undefined, { weekday: "long" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftType, setDraftType] = useState<"class" | "lab" | "break">("class");

  function resetDraft() {
    setDraftTime("");
    setDraftSubject("");
    setDraftType("class");
  }

  function startAdd() {
    setEditingId(null);
    resetDraft();
    setAdding(true);
  }

  function startEdit(id: string) {
    const c = classes.find((x) => x.id === id);
    if (!c) return;
    setAdding(false);
    setEditingId(id);
    setDraftTime(c.time);
    setDraftSubject(c.subject);
    setDraftType(c.type);
  }

  function saveDraft() {
    if (!draftSubject.trim()) return;
    if (adding) {
      addClassEntry(dayOfWeek, {
        time: draftTime.trim() || "—",
        subject: draftSubject.trim(),
        type: draftType,
      });
      setAdding(false);
    } else if (editingId) {
      updateClassEntry(dayOfWeek, editingId, {
        time: draftTime.trim() || "—",
        subject: draftSubject.trim(),
        type: draftType,
      });
      setEditingId(null);
    }
    resetDraft();
  }

  function cancelDraft() {
    setAdding(false);
    setEditingId(null);
    resetDraft();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="font-pixel text-[14px] uppercase tracking-wider drop-shadow-[0_0_6px_var(--color-primary)]">
            Class Schedule
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] uppercase text-muted-foreground">{dayName}</span>
          <button
            onClick={startAdd}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-primary"
            title="Add class"
            aria-label="Add class"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {classes.length === 0 && !adding && (
          <div className="px-2 py-2 text-center text-[11px] text-muted-foreground">
            No classes. Click + to add one.
          </div>
        )}

        {classes.map((c) =>
          editingId === c.id ? (
            <ClassEditor
              key={c.id}
              time={draftTime}
              subject={draftSubject}
              type={draftType}
              setTime={setDraftTime}
              setSubject={setDraftSubject}
              setType={setDraftType}
              onSave={saveDraft}
              onCancel={cancelDraft}
            />
          ) : (
            <div
              key={c.id}
              className={`group surface-inset flex items-center gap-2 rounded-[12px] px-2.5 py-2 ${
                c.type === "break" ? "opacity-60" : ""
              }`}
            >
              <div className="font-pixel w-[78px] shrink-0 text-[7px] text-muted-foreground">
                {c.time}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold">{c.subject}</div>
                {c.type === "lab" && (
                  <div className="font-pixel text-[7px] uppercase text-primary">Lab</div>
                )}
                {c.type === "break" && (
                  <div className="font-pixel text-[7px] uppercase text-muted-foreground">Break</div>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => startEdit(c.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"
                  aria-label="Edit class"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeClassEntry(dayOfWeek, c.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                  aria-label="Delete class"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ),
        )}

        {adding && (
          <ClassEditor
            time={draftTime}
            subject={draftSubject}
            type={draftType}
            setTime={setDraftTime}
            setSubject={setDraftSubject}
            setType={setDraftType}
            onSave={saveDraft}
            onCancel={cancelDraft}
          />
        )}
      </div>
    </section>
  );
}

function ClassEditor({
  time,
  subject,
  type,
  setTime,
  setSubject,
  setType,
  onSave,
  onCancel,
}: {
  time: string;
  subject: string;
  type: "class" | "lab" | "break";
  setTime: (v: string) => void;
  setSubject: (v: string) => void;
  setType: (v: "class" | "lab" | "break") => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="surface-inset flex flex-col gap-1.5 rounded-[12px] p-2">
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject / room"
        className="h-7 text-[11px]"
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <Input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="8:30 – 10:00 AM"
          className="h-7 flex-1 text-[10px]"
        />
        <Select value={type} onValueChange={(v) => setType(v as "class" | "lab" | "break")}>
          <SelectTrigger className="h-7 w-[88px] text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="lab">Lab</SelectItem>
            <SelectItem value="break">Break</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="h-7 px-2 text-[10px]" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

/* ---------------- To-Do List (no XP visible, check disabled until scheduled) ---------------- */
function ToDoList({ dw }: { dw: ReturnType<typeof useDevWorx> }) {
  const { state, addTask, deleteTask, toggleComplete, updateTask } = dw;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [value, setValue] = useState<Value>("academic");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = state.tasks.filter((t) => !t.eliminated);

  function submit() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), difficulty, value });
    setTitle("");
    setDifficulty("medium");
    setValue("academic");
    setOpen(false);
  }

  return (
    <section className="surface-card ring-soft flex min-h-0 flex-col gap-3 p-5 lg:h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="font-pixel text-[14px] uppercase tracking-wider drop-shadow-[0_0_6px_var(--color-primary)]">
            To-Do List
          </h2>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="h-8 gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tasks here are inactive. Drag them into a Time Block to activate the check.
      </p>

      <div className="flex max-h-[320px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none">
        {visible.length === 0 && (
          <div className="surface-inset px-4 py-8 text-center text-xs text-muted-foreground">
            Nothing yet. Add your first task.
          </div>
        )}
        {visible.map((t) => (
          <DraggableTask
            key={t.id}
            task={t}
            onToggle={() => toggleComplete(t.id)}
            onDelete={() => deleteTask(t.id)}
            onEdit={() => setEditingId(t.id)}
          />
        ))}
      </div>

      <EditTaskDialog
        task={visible.find((t) => t.id === editingId) ?? null}
        onClose={() => setEditingId(null)}
        onSave={(patch) => {
          if (editingId) updateTask(editingId, patch);
          setEditingId(null);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={value} onValueChange={(v) => setValue(v as Value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Add task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DraggableTask({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const diffColor = difficultyColor(task.difficulty);
  const checkEnabled = task.scheduled || task.done;

  const scheduledLabel =
    task.scheduled && task.scheduledDate && typeof task.scheduledHour === "number"
      ? `${formatScheduledDate(task.scheduledDate)} · ${hourLabel(task.scheduledHour)}`
      : null;

  const categoryLabel =
    task.value === "academic" ? "Academic" : task.value === "personal" ? "Personal" : "Academic";
  const xpGain = baseXpFor(task.difficulty);
  const coinGain = coinsFor(task.difficulty);

  return (
    <div
      ref={setNodeRef}
      className={`group surface-inset relative flex flex-col gap-2 px-3 py-2.5 transition ${
        isDragging ? "opacity-40" : "hover:translate-x-0.5"
      } ${task.done ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={!checkEnabled}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            task.done
              ? "border-primary bg-primary text-primary-foreground"
              : checkEnabled
                ? "border-primary/70 hover:bg-primary/10"
                : "border-muted bg-muted/30 cursor-not-allowed opacity-50",
          )}
          aria-label={task.done ? "Undo complete" : "Complete"}
          title={
            task.done
              ? "Click to undo (XP will be returned)"
              : checkEnabled
                ? "Mark complete"
                : "Schedule into a Time Block to enable"
          }
        >
          {task.done && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
          <div className={`truncate text-base font-semibold ${task.done ? "line-through" : ""}`}>{task.title}</div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"
            title="Edit task"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 pl-7">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-pixel rounded px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-white"
            style={{ background: diffColor }}
          >
            {task.difficulty}
          </span>
          <span className="font-pixel text-[7px] uppercase tracking-wider text-muted-foreground">
            {categoryLabel}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="font-pixel flex items-center gap-1.5 text-[7px] uppercase tracking-wider">
            <span className="text-primary">+{xpGain} XP</span>
            <span className="text-[#FACC15] drop-shadow-[0_0_3px_rgba(250,204,21,0.55)]">+{coinGain}🪙</span>
          </span>
        </div>
        {scheduledLabel && (
          <div className="flex items-center justify-end">
            <span
              className="font-pixel inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[7px] uppercase tracking-wider text-primary ring-1 ring-primary/40"
              title="Locked into a Time Block"
            >
              <CalendarIcon className="h-2.5 w-2.5" />
              {scheduledLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatScheduledDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return yyyyMmDd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------------- Edit task dialog ---------------- */
function EditTaskDialog({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (patch: { title: string; difficulty: Difficulty; value: Value }) => void;
}) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [value, setValue] = useState<Value>("academic");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDifficulty(task.difficulty);
      setValue(task.value === "goal" ? "academic" : task.value);
    }
  }, [task]);

  const open = !!task;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="e-title">Title</Label>
            <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: "#22C55E" }} />
                      Easy
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: "#FACC15" }} />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="hard">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: "#DE3335" }} />
                      Hard
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={value} onValueChange={(v) => setValue(v as Value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!title.trim()) return;
              onSave({ title: title.trim(), difficulty, value });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Time Blocking — 24h list, multi-task per hour, span scheduling, calendar mode ---------------- */
function TimeBlocking({
  dw,
  selectedDate,
  setSelectedDate,
}: {
  dw: ReturnType<typeof useDevWorx>;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}) {
  const { state, scheduleTask, unscheduleBlock, setTaskCategory } = dw;
  const dKey = dateKey(selectedDate);
  const dayBlocks = state.blocks.filter((b) => b.date === dKey);
  const availableTasks = state.tasks.filter((t) => !t.done && !t.eliminated);
  const HOURS = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const [calendarMode, setCalendarMode] = useState(false);

  const dateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="surface-card ring-soft flex min-h-0 flex-col gap-3 p-5 lg:h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="font-pixel text-[14px] uppercase tracking-wider drop-shadow-[0_0_6px_var(--color-primary)]">
            Time Blocks
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] uppercase text-muted-foreground">{dateLabel}</span>
          <button
            onClick={() => setCalendarMode((v) => !v)}
            className={cn(
              "rounded-md p-1.5 transition",
              calendarMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            title={calendarMode ? "Back to hours" : "Pick a date"}
            aria-label="Toggle calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {calendarMode ? (
        <div className="surface-inset flex min-h-0 flex-1 items-stretch justify-center overflow-hidden rounded-[12px] p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (d) {
                setSelectedDate(d);
                setCalendarMode(false);
              }
            }}
            className={cn(
              "pointer-events-auto h-full w-full p-3",
              "[&_[data-slot=calendar]]:h-full [&_[data-slot=calendar]]:w-full",
              "[&_.rdp-months]:h-full [&_.rdp-months]:w-full",
              "[&_.rdp-month]:h-full [&_.rdp-month]:w-full",
              "[&_table]:h-full [&_table]:w-full",
              "[&_[data-slot=calendar]]:[--cell-size:clamp(2rem,7vh,3.5rem)]",
            )}
          />
        </div>
      ) : (
        <div className="flex max-h-[420px] min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-none">
          {HOURS.map((hour) => {
            const blocksAtHour = dayBlocks.filter((b) => b.hour === hour);
            const tasksAtHour = blocksAtHour
              .map((b) => ({ block: b, task: state.tasks.find((t) => t.id === b.taskId) }))
              .filter((x) => !!x.task) as { block: typeof blocksAtHour[0]; task: Task }[];
            return (
              <HourSlot
                key={hour}
                hour={hour}
                items={tasksAtHour}
                availableTasks={availableTasks}
                onPick={(taskId) => scheduleTask(taskId, hour, 1, dKey)}
                onClear={(id) => unscheduleBlock(id)}
                onCategory={(taskId, c) => setTaskCategory(taskId, c)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function hourLabel(hour: number) {
  return `${((hour + 11) % 12) + 1}${hour < 12 ? " AM" : " PM"}`;
}

function HourSlot({
  hour,
  items,
  availableTasks,
  onPick,
  onClear,
  onCategory,
}: {
  hour: number;
  items: { block: { id: string; taskId: string }; task: Task }[];
  availableTasks: Task[];
  onPick: (taskId: string) => void;
  onClear: (blockId: string) => void;
  onCategory: (taskId: string, c: CategoryTag) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `hour-${hour}` });
  const label = hourLabel(hour);
  const isCurrent = new Date().getHours() === hour;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2 transition",
        isOver ? "border-primary bg-accent" : "border-transparent surface-inset",
        isCurrent && "ring-1 ring-primary/60",
      )}
    >
      <div className="font-pixel w-12 shrink-0 pt-1 text-[8px] text-muted-foreground">
        {label}
        {isCurrent && <div className="mt-0.5 text-[6px] text-primary">NOW</div>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {items.map(({ block, task }) => {
          const cat = task.category ?? "none";
          const catColor = CATEGORY_COLORS[cat]?.bg;
          return (
            <div key={block.id} className="flex items-center justify-between gap-2 rounded-md bg-card/40 px-2 py-1.5">
              {cat !== "none" && (
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/20"
                  style={{ background: catColor }}
                  title={CATEGORY_COLORS[cat].label}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-sm font-semibold", task.done && "line-through opacity-60")}>
                  {task.title}
                </div>
                <div className="font-pixel text-[7px] uppercase tracking-wider text-foreground">
                  {task.difficulty}
                </div>
              </div>
              <CategoryPicker value={cat} onChange={(c) => onCategory(task.id, c)} />
              <button onClick={() => onClear(block.id)} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <Select onValueChange={onPick}>
          <SelectTrigger className="h-7 w-full border-0 bg-transparent text-xs text-muted-foreground hover:text-foreground focus:ring-0">
            <SelectValue placeholder={items.length ? "+ add another task…" : "Drop a task or click to assign…"} />
          </SelectTrigger>
          <SelectContent>
            {availableTasks.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No tasks available</div>
            ) : (
              availableTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CategoryPicker({ value, onChange }: { value: CategoryTag; onChange: (c: CategoryTag) => void }) {
  const cats: CategoryTag[] = ["none", "red", "orange", "yellow", "green", "blue", "purple", "pink"];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label="Color tag"
          title="Color tag"
        >
          <Tag className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {cats.map((c) => {
            const meta = CATEGORY_COLORS[c];
            const isActive = value === c;
            return (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={cn(
                  "h-6 w-6 rounded-full border transition",
                  isActive ? "ring-2 ring-primary" : "border-border",
                  c === "none" && "bg-muted",
                )}
                style={c === "none" ? undefined : { background: meta.bg }}
                title={meta.label}
                aria-label={meta.label}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Side: Heatmap / Monthly Calendar with view toggle ---------------- */
function HeatmapCard({ history }: { history: ReturnType<typeof useDevWorx>["state"]["history"] }) {
  const [hover, setHover] = useState<{ date: string; x: number; y: number } | null>(null);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: getDay() returns 0=Sun..6=Sat. Convert so Mon=0..Sun=6.
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

  type Cell = { kind: "ghost" } | { kind: "day"; date: string; day: number };
  const cells: Cell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ kind: "ghost" });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ kind: "day", date: `${year}-${pad(month + 1)}-${pad(d)}`, day: d });
  }
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push({ kind: "ghost" });

  const historyByDate = new Map(history.map((h) => [h.date, h]));

  const hoverData = hover ? historyByDate.get(hover.date) : null;
  const hoverCompleted = hoverData ? hoverData.meaningful + hoverData.low : 0;
  const hoverTotal = hoverData ? hoverCompleted + hoverData.eliminated : 0;
  const hoverPct = hoverTotal > 0 ? Math.round((hoverCompleted / hoverTotal) * 100) : 0;

  return (
    <section className="relative flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-pixel text-[14px] uppercase tracking-wider drop-shadow-[0_0_6px_var(--color-primary)]">
            Activity
          </h2>
        </div>
        <span className="font-pixel text-[9px] uppercase tracking-wider text-muted-foreground">
          {monthLabel}
        </span>
      </div>

      <div className="grid w-full gap-[6px] px-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {dayLabels.map((l, i) => (
          <div key={`dl-${i}`} className="font-pixel text-center text-[8px] uppercase text-muted-foreground">
            {l}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell.kind === "ghost") {
            return (
              <div
                key={`g-${i}`}
                className="aspect-square rounded-[2px] border border-border/20 bg-transparent"
                aria-hidden
              />
            );
          }
          const h = historyByDate.get(cell.date);
          const completed = h ? h.meaningful + h.low : 0;
          const total = h ? completed + h.eliminated : 0;
          const ratio = total > 0 ? completed / total : 0;
          // Multi-level red shading
          let bg = "var(--color-muted)";
          let glow = "";
          if (total === 0) {
            bg = "color-mix(in oklab, var(--color-muted) 60%, transparent)";
          } else if (ratio <= 0.33) {
            bg = "color-mix(in oklab, var(--color-primary) 25%, transparent)";
          } else if (ratio <= 0.66) {
            bg = "color-mix(in oklab, var(--color-primary) 55%, transparent)";
          } else if (ratio < 1) {
            bg = "color-mix(in oklab, var(--color-primary) 80%, transparent)";
          } else {
            bg = "var(--color-primary)";
            glow = "0 0 6px var(--color-primary), 0 0 12px color-mix(in oklab, var(--color-primary) 60%, transparent)";
          }
          const pct = Math.round(ratio * 100);
          const tooltip = total > 0
            ? `${formatHeatmapDate(cell.date)}: ${completed}/${total} Tasks Completed - ${pct}%`
            : `${formatHeatmapDate(cell.date)}: No tasks`;
          return (
            <div
              key={cell.date}
              className="aspect-square rounded-[2px] border border-border/40 transition-transform hover:scale-110 hover:ring-1 hover:ring-primary/60"
              style={{ background: bg, boxShadow: glow || undefined }}
              title={tooltip}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const parentRect = (e.currentTarget.closest("section") as HTMLElement).getBoundingClientRect();
                setHover({
                  date: cell.date,
                  x: rect.left - parentRect.left + rect.width / 2,
                  y: rect.top - parentRect.top,
                });
              }}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </div>

      {hover && (
        <div
          className="font-pixel pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[4px] border border-border bg-surface-2 px-2 py-1 text-[9px] uppercase leading-tight text-foreground shadow-lg"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <div className="text-foreground">{formatHeatmapDate(hover.date)}</div>
          <div className="text-muted-foreground">
            {hoverTotal > 0
              ? `${hoverCompleted}/${hoverTotal} done · ${hoverPct}%`
              : "No tasks"}
          </div>
        </div>
      )}
    </section>
  );
}

function formatHeatmapDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return yyyyMmDd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

/* ---------------- Overload warning ---------------- */
function OverloadWarning({ count }: { count: number }) {
  if (count < 8) return null;
  return (
    <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
      <Flame className="h-4 w-4 text-primary" />
      <span>
        You have <strong>{count}</strong> active tasks. Consider eliminating a few — clarity matters more than volume.
      </span>
    </div>
  );
}

/* ---------------- Dragon tab ---------------- */
const DRAGON_LINES = [
  "I'm feeling energetic!",
  "A bit sleepy…",
  "Let's crush those tasks!",
  "Feed me with focus!",
  "One more quest, please!",
  "I believe in you, partner.",
  "Don't ghost the schedule!",
  "Eliminate the noise. Win the day.",
];

function DragonTab({ dw }: { dw: ReturnType<typeof useDevWorx> }) {
  const { state, buyFood, feedPetWithFood } = dw;
  const { pet } = state;
  const today = new Date().toISOString().slice(0, 10);
  const todayHistory = state.history.find((h) => h.date === today);
  const meaningfulToday = todayHistory?.meaningful ?? 0;
  const lowToday = todayHistory?.low ?? 0;
  const mood: "happy" | "neutral" | "tired" =
    meaningfulToday >= 3 ? "happy" : meaningfulToday >= 1 ? "neutral" : lowToday > 0 ? "tired" : "neutral";

  const [line, setLine] = useState(() => DRAGON_LINES[Math.floor(Math.random() * DRAGON_LINES.length)]);
  useEffect(() => {
    const id = setInterval(() => {
      setLine(DRAGON_LINES[Math.floor(Math.random() * DRAGON_LINES.length)]);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const moodLabel = mood === "happy" ? "Thriving" : mood === "tired" ? "Drained" : "Steady";

  // Track which food was last selected to feed; "jumping" toggles the animation class.
  const [selectedFood, setSelectedFood] = useState<FoodId | null>(null);
  const [jumping, setJumping] = useState(false);

  function triggerJump() {
    setJumping(false);
    // restart animation
    requestAnimationFrame(() => setJumping(true));
    window.setTimeout(() => setJumping(false), 650);
  }

  function handleFeed() {
    if (!selectedFood) return;
    const stock = state.foodInventory[selectedFood] ?? 0;
    if (stock <= 0) return;
    feedPetWithFood(selectedFood);
    triggerJump();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr_1fr]">
      {/* LEFT: Pet food shop + inventory */}
      <section className="surface-card ring-soft flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-pixel text-[11px] uppercase tracking-wider drop-shadow-[0_0_6px_var(--color-primary)]">
            Food Shop
          </h3>
          <span className="font-pixel inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[9px] text-[#FACC15] ring-1 ring-[#FACC15]/40">
            <Coins className="h-3 w-3" />
            {state.coins}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FOOD_SHOP.map((f) => {
            const stock = state.foodInventory[f.id] ?? 0;
            const canBuy = state.coins >= f.price;
            const isSelected = selectedFood === f.id;
            return (
              <div
                key={f.id}
                className={cn(
                  "surface-inset flex flex-col gap-1.5 rounded-[10px] p-2 transition",
                  isSelected && "ring-2 ring-primary",
                )}
              >
                <button
                  onClick={() => setSelectedFood(f.id)}
                  className="flex flex-col items-center gap-1"
                  title={`Select ${f.name}`}
                >
                  <div className="pixelated relative flex h-12 w-12 items-center justify-center rounded-md bg-surface-2 text-2xl">
                    <span aria-hidden>{f.emoji}</span>
                    {stock > 0 && (
                      <span className="font-pixel absolute -right-1 -top-1 rounded-sm bg-primary px-1 text-[7px] leading-tight text-primary-foreground">
                        ×{stock}
                      </span>
                    )}
                  </div>
                  <span className="font-pixel text-center text-[7px] uppercase leading-tight text-foreground">
                    {f.name}
                  </span>
                </button>
                <button
                  onClick={() => buyFood(f.id)}
                  disabled={!canBuy}
                  className={cn(
                    "font-pixel flex items-center justify-center gap-1 rounded-md px-1 py-1 text-[7px] uppercase transition",
                    canBuy
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
                  )}
                  title={canBuy ? `Buy for ${f.price} coins` : "Not enough coins"}
                >
                  <Coins className="h-2.5 w-2.5" />
                  {f.price}
                </button>
              </div>
            );
          })}
        </div>
        <div className="surface-inset rounded-md p-2 text-[10px] leading-snug text-muted-foreground">
          Earn coins by completing tasks (Easy +2, Medium +5, Hard +10). Select a food and tap <strong>Feed</strong>.
        </div>
      </section>

      {/* MIDDLE: Pet display */}
      <section className="surface-card ring-soft flex flex-col items-center gap-5 p-8">
        <div className="text-center">
          <div className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">
            {pet.stage} · {moodLabel}
          </div>
          <h2 className="mt-1 font-pixel text-[14px]">{pet.name}</h2>
        </div>
        <div className="relative max-w-[260px]">
          <div className="rounded-[12px] border border-border bg-surface-2 px-4 py-2.5 text-center text-sm font-medium text-foreground shadow-sm">
            {line}
          </div>
          <div className="absolute left-1/2 -bottom-2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface-2" aria-hidden />
        </div>
        <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-surface-2">
          <img
            src={dragonSrc(state.dragonId)}
            alt="dragon"
            className={cn(
              "pixelated h-44 w-44 object-contain",
              mood === "tired" && !jumping ? "opacity-60" : "",
              jumping ? "animate-pet-jump" : (mood !== "tired" ? "animate-floaty" : ""),
            )}
          />
        </div>
        <button
          onClick={handleFeed}
          disabled={!selectedFood || (state.foodInventory[selectedFood ?? "ilocos_empanada"] ?? 0) <= 0}
          className={cn(
            "font-pixel flex items-center gap-2 rounded-md border-2 border-black px-4 py-2 text-[9px] uppercase tracking-wider transition",
            selectedFood && (state.foodInventory[selectedFood] ?? 0) > 0
              ? "bg-primary text-primary-foreground hover:scale-[1.03] active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
          )}
          title={selectedFood ? `Feed ${selectedFood}` : "Select a food first"}
        >
          🍴 Feed Pet
        </button>
      </section>

      {/* RIGHT: Stats — XP / Health / Hunger aligned */}
      <section className="surface-card ring-soft flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-[11px] uppercase tracking-wider">Stats</h3>
          <span className="font-pixel text-[10px] text-primary drop-shadow-[0_0_4px_var(--color-primary)]">
            LVL {pet.level ?? 1}
          </span>
        </div>
        <StatBar label={`Pet XP (Lv ${pet.level ?? 1})`} value={pet.xp} tone="good" />
        <StatBar label="Health" value={pet.health} tone="good" />
        <StatBar label="Hunger" value={pet.hunger} tone="mixed" inverted />
        <div className="surface-inset mt-2 p-4 text-sm leading-relaxed text-muted-foreground">
          {mood === "happy"
            ? "Your dragon is thriving — meaningful work today is feeding it well."
            : mood === "tired"
              ? "Your dragon is drained. Complete a meaningful task to revive it."
              : pet.xp > 70
                ? "Almost evolving — finish one more meaningful task to push it over."
                : "Steady growth. Complete tasks from your To-Do List to feed it."}
        </div>
      </section>
    </div>
  );
}

function StatBar({
  label, value, tone, inverted = false,
}: { label: string; value: number; tone: "good" | "mixed" | "bad"; inverted?: boolean }) {
  const color = tone === "good" ? "var(--color-signal-good)" : tone === "mixed" ? "var(--color-signal-mixed)" : "var(--color-signal-bad)";
  const display = inverted ? 100 - value : value;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)}</span>
      </div>
      <div className="surface-inset h-2 overflow-hidden">
        <div className="h-full rounded-md transition-[width] duration-500" style={{ width: `${display}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------------- Friends tab ---------------- */
/* ---------------- Connections / Leaderboard (mock data) ---------------- */
type LeaderboardEntry = {
  username: string;
  level: number;
  spec: import("@/components/PixelAvatar").PixelAvatarSpec;
  /** 7 days, oldest → newest. Each value 0..3 (0 none, 1 mixed, 2 good, 3 great). */
  activity: number[];
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { username: "Nico Liwanag",     level: 9, spec: { skin: "#F1C27D", hair: "short",    hairColor: "#2B1B0E", shirt: "#DE3335", accessory: "none"     }, activity: [3,3,2,3,3,2,3] },
  { username: "Chasty Espinoza",  level: 8, spec: { skin: "#D9A066", hair: "long",     hairColor: "#7A4B22", shirt: "#A855F7", accessory: "earring"  }, activity: [2,3,3,2,3,2,3] },
  { username: "Mark Guevarra",    level: 7, spec: { skin: "#F8D7B5", hair: "spiky",    hairColor: "#15151B", shirt: "#22C55E", accessory: "glasses"  }, activity: [3,2,2,3,2,3,2] },
  { username: "Jasmine Dela Cruz",level: 6, spec: { skin: "#F1C27D", hair: "long",     hairColor: "#DE3335", shirt: "#F59E0B", accessory: "none"     }, activity: [1,2,2,3,2,1,2] },
  { username: "Paolo Mendoza",    level: 5, spec: { skin: "#A87149", hair: "ponytail", hairColor: "#2B1B0E", shirt: "#3B82F6", accessory: "headband" }, activity: [2,1,2,2,1,2,3] },
  { username: "Andrea Bautista",  level: 4, spec: { skin: "#F8D7B5", hair: "long",     hairColor: "#2B1B0E", shirt: "#EC4899", accessory: "earring"  }, activity: [1,2,1,2,2,1,2] },
  { username: "Joshua Ramos",     level: 3, spec: { skin: "#6B4423", hair: "bald",     hairColor: "#15151B", shirt: "#15151B", accessory: "glasses"  }, activity: [1,0,1,2,1,0,2] },
  { username: "Bea Santiago",     level: 3, spec: { skin: "#D9A066", hair: "short",    hairColor: "#7A4B22", shirt: "#10B981", accessory: "none"     }, activity: [0,1,1,2,1,2,1] },
];

function activityColor(v: number): string {
  if (v >= 3) return "var(--color-primary)";
  if (v === 2) return "color-mix(in oklab, var(--color-primary) 65%, transparent)";
  if (v === 1) return "color-mix(in oklab, var(--color-primary) 30%, transparent)";
  return "var(--color-surface-2)";
}

function FriendsTab() {
  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => b.level - a.level);
  return (
    <section className="surface-card ring-soft flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-pixel text-[12px] uppercase">Connections — Leaderboard</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Live demo data. Top players ranked by level. Each row shows their pixel avatar and 7-day activity.
      </p>
      <ol className="flex flex-col gap-2">
        {sorted.map((p, i) => (
          <li
            key={p.username}
            className="surface-inset flex items-center gap-4 p-3"
          >
            <span className="font-pixel text-[10px] w-6 text-center text-primary drop-shadow-[0_0_4px_var(--color-primary)]">
              #{i + 1}
            </span>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border-2 border-primary bg-surface-2 flex items-center justify-center shadow-[0_0_8px_var(--color-primary)]">
              <PixelAvatar spec={p.spec} size={44} />
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{p.username}</span>
                <span className="font-pixel text-[8px] text-primary">LVL {p.level}</span>
              </div>
              <div className="flex items-center gap-1">
                {p.activity.map((v, idx) => (
                  <span
                    key={idx}
                    title={`Day ${idx + 1}: ${v}`}
                    className="h-3 w-3 rounded-[2px] border border-border"
                    style={{ backgroundColor: activityColor(v) }}
                  />
                ))}
                <span className="ml-2 font-pixel text-[7px] uppercase text-muted-foreground">7-day</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- Settings tab ---------------- */
function SettingsTab({ dw }: { dw: ReturnType<typeof useDevWorx> }) {
  const { state, setTheme, setUsername, setAvatarId, setDragonId, setPixelAvatar } = dw;
  const [name, setName] = useState(state.username);

  useEffect(() => setName(state.username), [state.username]);

  return (
    <section className="surface-card ring-soft mx-auto flex max-w-2xl flex-col gap-7 p-6">
      <h2 className="font-pixel text-[12px] uppercase">Settings</h2>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="uname">Username</Label>
        <div className="flex gap-2">
          <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Button onClick={() => setUsername(name.trim() || state.username)} disabled={!name.trim() || name === state.username}>
            Save
          </Button>
        </div>
      </div>

      {/* Pixel avatar customizer (Stardew-style, non-overlapping layers) */}
      <div className="space-y-3">
        <Label>Pixel character</Label>
        <div className="surface-inset flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[12px] border-2 border-primary bg-surface-2 shadow-[0_0_12px_var(--color-primary)]">
            <PixelAvatar spec={state.pixelAvatar} size={104} />
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <SwatchRow
              label="Skin"
              colors={SKIN_TONES}
              value={state.pixelAvatar.skin}
              onChange={(c) => setPixelAvatar({ skin: c })}
            />
            <ChoiceRow
              label="Hair"
              choices={HAIR_STYLES as readonly string[]}
              value={state.pixelAvatar.hair}
              onChange={(v) => setPixelAvatar({ hair: v })}
            />
            <SwatchRow
              label="Hair color"
              colors={HAIR_COLORS}
              value={state.pixelAvatar.hairColor}
              onChange={(c) => setPixelAvatar({ hairColor: c })}
            />
            <SwatchRow
              label="Shirt"
              colors={SHIRT_COLORS}
              value={state.pixelAvatar.shirt}
              onChange={(c) => setPixelAvatar({ shirt: c })}
            />
            <ChoiceRow
              label="Accessory"
              choices={ACCESSORIES as readonly string[]}
              value={state.pixelAvatar.accessory}
              onChange={(v) => setPixelAvatar({ accessory: v })}
            />
          </div>
        </div>
      </div>

      {/* Avatar selector */}
      {/* Dragon selector */}
      <div className="space-y-2">
        <Label>Dragon mascot</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {DRAGONS.map((d) => {
            const active = state.dragonId === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDragonId(d.id)}
                className={cn(
                  "surface-inset flex flex-col items-center gap-1 rounded-[12px] p-2 transition hover:border-primary",
                  active && "ring-2 ring-primary shadow-[0_0_10px_var(--color-primary)]",
                )}
                title={d.label}
              >
                <img src={d.src} alt={d.label} className="pixelated h-16 w-16 object-contain" />
                <span className="font-pixel text-[7px] uppercase text-muted-foreground">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme */}
      <div className="surface-inset flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {state.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <div>
            <div className="text-sm font-semibold">Dark mode</div>
            <div className="text-xs text-muted-foreground">Charcoal with neon red accents</div>
          </div>
        </div>
        <Switch checked={state.theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
      </div>
    </section>
  );
}

/* ---------------- Top nav (moved from footer to top — visuals preserved) ---------------- */
function TopNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="z-40 flex justify-center pb-1">
      <div className="surface-card ring-soft inline-flex items-center gap-2 rounded-full p-1.5">
        <a
          href="https://auf.instructure.com/login/canvas"
          target="_blank"
          rel="noreferrer"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:scale-105"
          title="AUF Canvas"
        >
          <img src={auLogo} alt="AUF" className="h-9 w-9 object-contain" />
        </a>
        <div className="flex items-center gap-1">
          <NavBtn icon={<Home className="h-4 w-4" />} label="Home" active={tab === "home"} onClick={() => setTab("home")} />
          <NavBtn icon={<Flame className="h-4 w-4" />} label="Dragon" active={tab === "dragon"} onClick={() => setTab("dragon")} />
          <NavBtn icon={<Users className="h-4 w-4" />} label="Connections" active={tab === "friends"} onClick={() => setTab("friends")} />
          <NavBtn icon={<SettingsIcon className="h-4 w-4" />} label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
        </div>
      </div>
    </nav>
  );
}

function NavBtn({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 font-pixel text-[8px] uppercase transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// suppress unused-import warnings for icons referenced only in select sections
void Target;
void ChevronLeft;
void ChevronRight;

/* ---------------- Customizer rows ---------------- */
function SwatchRow({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-pixel text-[8px] uppercase text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => {
          const active = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                "h-7 w-7 rounded-[6px] border-2 transition",
                active ? "border-primary shadow-[0_0_8px_var(--color-primary)]" : "border-border hover:border-primary",
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          );
        })}
      </div>
    </div>
  );
}

function ChoiceRow({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-pixel text-[8px] uppercase text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {choices.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                "rounded-[6px] border-2 px-2 py-1 font-pixel text-[8px] uppercase transition",
                active
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_8px_var(--color-primary)]"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// suppress unused-import warning for legacy avatarSrc helper
void avatarSrc;
