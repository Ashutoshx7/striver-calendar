"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

type PersistedRange = {
  startDate: string | null;
  endDate: string | null;
};

const NOTE_STORAGE_PREFIX = "wall-calendar:note:v3";
const RANGE_STORAGE_KEY = "wall-calendar:range:v3";
const RANGE_NOTE_STORAGE_PREFIX = "wall-calendar:range-note:v1";
const VIEW_STORAGE_KEY = "wall-calendar:view:v1";
const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const MONTH_THEMES = [
  { name: "Winter Blue", color: "#27A8DF", bg: "bg-[#e5e5e8]", gradient: "from-[#e5e5e8] to-[#d1d5db]" }, // Jan
  { name: "Rose Pink", color: "#F43F5E", bg: "bg-[#f5e6e8]", gradient: "from-[#f5e6e8] to-[#fbcfe8]" },   // Feb
  { name: "Spring Green", color: "#10B981", bg: "bg-[#e6f5e8]", gradient: "from-[#e6f5e8] to-[#bbf7d0]" }, // Mar
  { name: "Rainy Purple", color: "#8B5CF6", bg: "bg-[#ece5f5]", gradient: "from-[#ece5f5] to-[#e9d5ff]" }, // Apr
  { name: "Sunny Yellow", color: "#EAB308", bg: "bg-[#f5f5e5]", gradient: "from-[#f5f5e5] to-[#fef08a]" }, // May
  { name: "Summer Orange", color: "#F97316", bg: "bg-[#f5eee5]", gradient: "from-[#f5eee5] to-[#fed7aa]" },// Jun
  { name: "Ocean Cyan", color: "#06B6D4", bg: "bg-[#e5f1f5]", gradient: "from-[#e5f1f5] to-[#a5f3fc]" },   // Jul
  { name: "Warm Red", color: "#EF4444", bg: "bg-[#f5e6e5]", gradient: "from-[#f5e6e5] to-[#fecaca]" },     // Aug
  { name: "Autumn Amber", color: "#D97706", bg: "bg-[#f5ebe5]", gradient: "from-[#f5ebe5] to-[#fed7aa]" }, // Sep
  { name: "Fall Brown", color: "#A16207", bg: "bg-[#edeae5]", gradient: "from-[#edeae5] to-[#fed7aa]" },   // Oct
  { name: "Stormy Grey", color: "#64748B", bg: "bg-[#e8e9eb]", gradient: "from-[#e8e9eb] to-[#cbd5e1]" },   // Nov
  { name: "Frosty Teal", color: "#0EA5E9", bg: "bg-[#e5f2f5]", gradient: "from-[#e5f2f5] to-[#bae6fd]" }    // Dec
];

const RING_COUNT = 43;
const HERO_VIDEO_SRC = "/climber.mp4";
const ASSET_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const HOLIDAY_MARKERS: Record<string, string> = {
  "01-01": "New Year's Day",
  "07-04": "Independence Day",
  "11-11": "Veterans Day",
  "12-25": "Christmas Day",
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function withAssetBasePath(path: string) {
  return `${ASSET_BASE_PATH}${path}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toMonthDayKey(date: Date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseMonthKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return null;
  }

  const parsed = new Date(year, month - 1, 1);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseDateKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateOnly(parsed);
}

function isSameDay(first: Date | null, second: Date | null) {
  if (!first || !second) {
    return false;
  }
  return toDateKey(first) === toDateKey(second);
}

function isDateBetween(target: Date, start: Date | null, end: Date | null) {
  if (!start || !end) {
    return false;
  }
  const time = target.getTime();
  return time > start.getTime() && time < end.getTime();
}

function buildCalendarCells(viewDate: Date): CalendarCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - mondayOffset + 1;
    const date = new Date(year, month, dayNumber);
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    cells.push({ date, inCurrentMonth });
  }

  return cells;
}

export default function Home() {
  const [direction, setDirection] = useState(1);
  const [viewDate, setViewDate] = useState(() => new Date(2022, 0, 1));
  const [note, setNote] = useState("");
  const [rangeNote, setRangeNote] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragAnchorDate, setDragAnchorDate] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadedMonthKey, setLoadedMonthKey] = useState<string | null>(null);
  const [loadedRangeKey, setLoadedRangeKey] = useState<string | null>(null);
  const [viewReady, setViewReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const monthName = monthFormatter.format(viewDate).toUpperCase();
  const currentTheme = MONTH_THEMES[viewDate.getMonth()];
  const ACCENT = currentTheme.color;
  const currentTheme = MONTH_THEMES[viewDate.getMonth()];
  const ACCENT = currentTheme.color;
  const yearLabel = String(viewDate.getFullYear());
  const cells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);
  const flipVariants = {
    initial: (dir: number) => ({
      rotateX: dir > 0 ? -90 : 90,
      opacity: 0,
      transformOrigin: "top center",
      scale: 0.98,
    }),
    center: {
      rotateX: 0,
      opacity: 1,
      transformOrigin: "top center",
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    exit: (dir: number) => ({
      rotateX: dir > 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: "top center",
      scale: 0.98,
      transition: { duration: 0.4 },
    }),
  };
  const monthStorageKey = `${NOTE_STORAGE_PREFIX}:${toMonthKey(viewDate)}`;

  const previewRange = useMemo(() => {
    if (!startDate) {
      return { rangeStart: null as Date | null, rangeEnd: null as Date | null };
    }

    const candidate = endDate ?? hoverDate;
    if (!candidate) {
      return { rangeStart: startDate, rangeEnd: startDate };
    }

    if (candidate.getTime() >= startDate.getTime()) {
      return { rangeStart: startDate, rangeEnd: candidate };
    }

    return { rangeStart: candidate, rangeEnd: startDate };
  }, [endDate, hoverDate, startDate]);

  const activeRangeKey = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }

    const first = toDateKey(startDate);
    const second = toDateKey(endDate);
    return first < second ? `${first}__${second}` : `${second}__${first}`;
  }, [endDate, startDate]);

  const activeRangeLabel = useMemo(() => {
    if (!startDate || !endDate) {
      return "";
    }

    const first = startDate.getTime() <= endDate.getTime() ? startDate : endDate;
    const second = startDate.getTime() <= endDate.getTime() ? endDate : startDate;
    return `${shortDateFormatter.format(first)} - ${shortDateFormatter.format(second)}`;
  }, [endDate, startDate]);

  const selectionLabel = useMemo(() => {
    if (!startDate) {
      return "Select any two dates";
    }

    if (!endDate) {
      return `Start: ${shortDateFormatter.format(startDate)}`;
    }

    const startLabel = shortDateFormatter.format(startDate);
    const endLabel = shortDateFormatter.format(endDate);
    return `Range: ${startLabel} - ${endLabel}`;
  }, [endDate, startDate]);

  function setMonthWithOffset(offset: number) {
    setDirection(offset > 0 ? 1 : -1);
    setViewDate((previous) => {
      return new Date(previous.getFullYear(), previous.getMonth() + offset, 1);
    });
  }

  function goToCurrentMonth() {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  useEffect(() => {
    let cancelled = false;
    const savedViewDate = parseMonthKey(localStorage.getItem(VIEW_STORAGE_KEY));

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      if (savedViewDate) {
        setViewDate(savedViewDate);
      }
      setViewReady(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!viewReady) {
      return;
    }
    localStorage.setItem(VIEW_STORAGE_KEY, toMonthKey(viewDate));
  }, [viewDate, viewReady]);

  useEffect(() => {
    let nextNote = "";
    let nextStart: Date | null = null;
    let nextEnd: Date | null = null;

    const savedNote = localStorage.getItem(monthStorageKey);
    if (savedNote) {
      nextNote = savedNote;
    }

    const savedRange = localStorage.getItem(RANGE_STORAGE_KEY);
    if (savedRange) {
      try {
        const parsed: PersistedRange = JSON.parse(savedRange);
        nextStart = parseDateKey(parsed.startDate);
        nextEnd = parseDateKey(parsed.endDate);
      } catch {
        // Ignore malformed payloads.
      }
    }

    const timer = window.setTimeout(() => {
      setNote(nextNote);
      setStartDate(nextStart);
      setEndDate(nextEnd);
      setHydrated(true);
      setLoadedMonthKey(monthStorageKey);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [monthStorageKey]);

  useEffect(() => {
    if (!hydrated || loadedMonthKey !== monthStorageKey) {
      return;
    }
    localStorage.setItem(monthStorageKey, note);
  }, [hydrated, loadedMonthKey, monthStorageKey, note]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const payload: PersistedRange = {
      startDate: startDate ? toDateKey(startDate) : null,
      endDate: endDate ? toDateKey(endDate) : null,
    };
    localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(payload));
  }, [endDate, hydrated, startDate]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!activeRangeKey) {
      const timer = window.setTimeout(() => {
        setRangeNote("");
        setLoadedRangeKey(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const savedRangeNote =
      localStorage.getItem(`${RANGE_NOTE_STORAGE_PREFIX}:${activeRangeKey}`) ?? "";

    const timer = window.setTimeout(() => {
      setRangeNote(savedRangeNote);
      setLoadedRangeKey(activeRangeKey);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeRangeKey, hydrated]);

  useEffect(() => {
    if (!hydrated || !activeRangeKey || loadedRangeKey !== activeRangeKey) {
      return;
    }
    localStorage.setItem(`${RANGE_NOTE_STORAGE_PREFIX}:${activeRangeKey}`, rangeNote);
  }, [activeRangeKey, hydrated, loadedRangeKey, rangeNote]);

  function handleDayClick(date: Date) {
    const normalized = toDateOnly(date);
    setHoverDate(null);

    if (!startDate || endDate) {
      setStartDate(normalized);
      setEndDate(null);
      return;
    }

    if (isSameDay(normalized, startDate)) {
      setEndDate(normalized);
      return;
    }

    if (normalized.getTime() < startDate.getTime()) {
      setEndDate(startDate);
      setStartDate(normalized);
      return;
    }

    setEndDate(normalized);
  }

  function handleDayHover(date: Date) {
    if (!startDate || endDate) {
      return;
    }

    setHoverDate(toDateOnly(date));
  }

  function handleDayPointerDown(date: Date) {
    const normalized = toDateOnly(date);
    setIsPointerDown(true);
    setHasDragged(false);
    setDragAnchorDate(normalized);
    setHoverDate(normalized);
  }

  function handleDayPointerEnter(date: Date) {
    if (!isPointerDown || !dragAnchorDate) {
      return;
    }

    const normalized = toDateOnly(date);
    setHoverDate(normalized);
    if (!isSameDay(normalized, dragAnchorDate)) {
      setHasDragged(true);
    }
  }

  function finishPointerSelection(date?: Date) {
    if (!isPointerDown) {
      return;
    }

    const selectedDate = date ? toDateOnly(date) : null;
    if (hasDragged && dragAnchorDate) {
      const target = selectedDate ?? hoverDate ?? dragAnchorDate;
      if (target.getTime() < dragAnchorDate.getTime()) {
        setStartDate(target);
        setEndDate(dragAnchorDate);
      } else {
        setStartDate(dragAnchorDate);
        setEndDate(target);
      }
    } else if (selectedDate) {
      handleDayClick(selectedDate);
    }

    setIsPointerDown(false);
    setHasDragged(false);
    setDragAnchorDate(null);
    setHoverDate(null);
  }

  useEffect(() => {
    if (!isPointerDown) {
      return;
    }

    const handlePointerEnd = () => {
      if (hasDragged && dragAnchorDate) {
        const target = hoverDate ?? dragAnchorDate;
        if (target.getTime() < dragAnchorDate.getTime()) {
          setStartDate(target);
          setEndDate(dragAnchorDate);
        } else {
          setStartDate(dragAnchorDate);
          setEndDate(target);
        }
      }

      setIsPointerDown(false);
      setHasDragged(false);
      setDragAnchorDate(null);
      setHoverDate(null);
    };
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [isPointerDown, hasDragged, dragAnchorDate, hoverDate]);

  function clearSelection() {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
  }

  return (
    <main className={`flex min-h-screen items-start justify-center px-2 pb-8 pt-8 sm:px-3 sm:pb-10 sm:pt-12 transition-colors duration-1000 ease-in-out bg-gradient-to-br ${currentTheme.gradient}`}>
      <section className="w-full max-w-[548px]">
        <div className="pointer-events-none relative mx-auto h-[64px] w-full">
          <svg
            viewBox="0 0 548 64"
            className="h-full w-full"
            aria-hidden="true"
            fill="none"
          >
            <defs>
              <linearGradient id="wireStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2b3038" />
                <stop offset="100%" stopColor="#4f5460" />
              </linearGradient>
              <linearGradient id="railStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#272c33" />
                <stop offset="100%" stopColor="#3f444d" />
              </linearGradient>
              <filter
                id="wireShadow"
                x="-30%"
                y="-30%"
                width="160%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="0.95"
                  stdDeviation="0.45"
                  floodColor="#000"
                  floodOpacity="0.24"
                />
              </filter>
              <filter
                id="foldShadow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feDropShadow
                  dx="0"
                  dy="1"
                  stdDeviation="0.72"
                  floodColor="#000"
                  floodOpacity="0.12"
                />
              </filter>
              <filter
                id="hookShadow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feDropShadow
                  dx="0"
                  dy="1.05"
                  stdDeviation="0.75"
                  floodColor="#000"
                  floodOpacity="0.26"
                />
              </filter>
              <filter id="pinShadow" x="-120%" y="-120%" width="340%" height="340%">
                <feDropShadow
                  dx="1.4"
                  dy="1.6"
                  stdDeviation="1.05"
                  floodColor="#000"
                  floodOpacity="0.2"
                />
              </filter>
            </defs>

            <line x1="1.5" y1="21.5" x2="546.5" y2="21.5" stroke="url(#railStroke)" strokeWidth="2.1" />
            <line
              x1="1.5"
              y1="22.8"
              x2="546.5"
              y2="22.8"
              stroke="#ffffff"
              strokeOpacity="0.34"
              strokeWidth="0.95"
            />

            {Array.from({ length: RING_COUNT + 1 }).map((_, index) => {
              const x = 2.5 + index * 12.7;
              if (x > 266 && x < 282) {
                return null;
              }
              return (
                <line
                  key={`tick-${index}`}
                  x1={x}
                  y1="21.9"
                  x2={x}
                  y2="26.6"
                  stroke="#454a54"
                  strokeWidth="1.2"
                />
              );
            })}

            <g filter="url(#foldShadow)">
              <path
                d="M253.5 21.7Q274 16 294.5 21.7L286 31.6Q274 34.1 262 31.6Z"
                fill="#f2f3f6"
                stroke="#d3d7dc"
                strokeWidth="0.8"
              />
              <path
                d="M262.2 29.8Q274 32.1 285.8 29.8"
                stroke="#c0c6ce"
                strokeWidth="0.8"
              />
              <path
                d="M254.6 22.8Q274 18.2 293.4 22.8"
                stroke="#ffffff"
                strokeOpacity="0.78"
                strokeWidth="0.82"
              />
            </g>

            <g filter="url(#pinShadow)">
              <line
                x1="274"
                y1="1.2"
                x2="274"
                y2="12.4"
                stroke="#696b70"
                strokeWidth="1.85"
                strokeLinecap="round"
              />
              <ellipse cx="274" cy="1.1" rx="1.6" ry="1.1" fill="#75777c" />
            </g>

            <g filter="url(#hookShadow)">
              <path
                d="M260.8 11.2C260.8 25.9 287.2 25.9 287.2 11.2"
                stroke="#2f3339"
                strokeWidth="2.7"
                strokeLinecap="round"
              />
              <line
                x1="274"
                y1="11.2"
                x2="274"
                y2="23.1"
                stroke="#2f3339"
                strokeWidth="2.15"
                strokeLinecap="round"
              />
              <path
                d="M260.8 11.2C260.8 17.5 266 21.8 274 21.8C282 21.8 287.2 17.5 287.2 11.2"
                stroke="#ffffff"
                strokeOpacity="0.23"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>

            <g filter="url(#wireShadow)">
              {Array.from({ length: RING_COUNT }).map((_, index) => {
                const x = 2 + index * 12.7;
                if (x > 263 && x < 285) {
                  return null;
                }
                return (
                  <g key={`ring-${index}`}>
                    <line
                      x1={x + 3.3}
                      y1="26.5"
                      x2={x + 3.3}
                      y2="30.4"
                      stroke="#2f333a"
                      strokeWidth="1.1"
                    />
                    <path
                      d={`M${x} 41.2V35.2C${x} 31.1 ${x + 6.6} 31.1 ${x + 6.6} 35.2V41.2`}
                      stroke="url(#wireStroke)"
                      strokeWidth="1.38"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${x + 0.65} 35.2C${x + 0.65} 32.5 ${x + 5.95} 32.5 ${x + 5.95} 35.2`}
                      stroke="#ffffff"
                      strokeOpacity="0.23"
                      strokeWidth="0.75"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="mt-[-2px] relative z-10 w-full aspect-[548/791]" style={{ perspective: "1500px" }}><AnimatePresence custom={direction} mode="popLayout" initial={false}><motion.article key={toMonthKey(viewDate)} custom={direction} variants={flipVariants} initial="initial" animate="center" exit="exit" className="absolute inset-0 overflow-hidden border border-[#d7d7dc] bg-[#fcfcfd] shadow-[0_26px_48px_rgba(0,0,0,0.19)]">
          <header className="relative h-[48%]">
            {!videoFailed && (
              <video
                className={cx(
                  "absolute inset-0 h-full w-full object-cover object-[center_38%] saturate-[0.92] contrast-[0.96] transition-opacity duration-700",
                  videoReady ? "opacity-100" : "opacity-0"
                )}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={withAssetBasePath("/calendar-hero.svg")}
                onCanPlay={() => setVideoReady(true)}
                onError={() => {
                  setVideoFailed(true);
                  setVideoReady(false);
                }}
              >
                <source src={withAssetBasePath(HERO_VIDEO_SRC)} type="video/mp4" />
              </video>
            )}
            <Image
              src={withAssetBasePath("/calendar-hero.svg")}
              alt="Mountain climber hero visual"
              fill
              priority
              className={cx(
                "object-cover object-[center_38%] saturate-[0.92] contrast-[0.94] transition-opacity duration-700",
                videoReady && !videoFailed ? "opacity-0" : "opacity-100"
              )}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.01)_46%,rgba(15,23,42,0.26))]" />

            <div className="absolute bottom-0 left-0 right-0 h-[90px]">
              <svg
                className="h-full w-full"
                viewBox="0 0 1000 180"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 66 L322 180 L0 180 Z" fill="#28A8E1" />
                <path d="M1000 38 L634 180 L1000 180 Z" fill="#2B9FD7" />
                <path d="M246 180 L500 92 L734 180 Z" fill="#FFFFFF" />
                <path d="M734 180 C804 151 876 151 946 180 Z" fill="#FFFFFF" />
              </svg>
            </div>

            <div className="absolute bottom-8 right-6 text-right text-white">
              <p className="text-[1.55rem] font-light leading-none tracking-[0.03em]">
                {yearLabel}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-[1.95rem] font-semibold leading-none tracking-[0.01em]">
                {monthName}
              </p>
            </div>
          </header>

          <div className="grid h-[52%] grid-cols-1 grid-rows-[130px_1fr] gap-3 px-4 pb-4 pt-3 sm:grid-cols-[176px_1fr] sm:grid-rows-1 sm:gap-4 sm:px-6 sm:pb-5">
            <aside className="min-h-0 sm:pr-1">
              <h2 className="text-[12px] font-semibold text-[#666]">Notes</h2>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write quick notes..."
                className={cx(
                  "mt-2 w-full resize-none border-0 bg-transparent px-1 text-[13px] leading-[26px] text-[#555] outline-none placeholder:text-[#b2b2b6] sm:leading-[30px]",
                  activeRangeKey ? "h-[calc(100%-74px)] sm:h-[calc(100%-82px)]" : "h-[calc(100%-22px)]"
                )}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0 25px, rgba(0,0,0,0.15) 25px 26px)",
                }}
              />
              {activeRangeKey && (
                <div className="mt-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a8d95]">
                    Range Note - {activeRangeLabel}
                  </p>
                  <input
                    type="text"
                    value={rangeNote}
                    onChange={(event) => setRangeNote(event.target.value)}
                    placeholder="Attach a note to this range..."
                    className="mt-1 w-full rounded-md border border-[#d6d7dc] bg-white/80 px-2 py-1 text-[11px] text-[#585a61] outline-none placeholder:text-[#aaadb5] focus:border-[#9ccfe8]"
                  />
                </div>
              )}
            </aside>

            <section className="min-h-0 pt-1 sm:pt-3">
              <div className="mb-2 flex items-center justify-center">
                <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#8b8b90]">
                  {monthName} {yearLabel}
                </span>
              </div>


              <div className="grid grid-cols-7 gap-x-1 text-center">
                {WEEK_DAYS.map((day) => {
                  const isWeekend = day === "SAT" || day === "SUN";
                  return (
                    <span
                      key={day}
                      className={cx(
                        "text-[11px] font-semibold tracking-[0.03em] sm:text-[12px]",
                        isWeekend ? "text-current" : "text-[#565656]"
                      )}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>

              <p className="mt-0.5 text-right text-[10px] font-medium uppercase tracking-[0.08em] text-[#8b8b90]">
                {selectionLabel}
              </p>

              <div className="mt-2 grid grid-cols-7 gap-x-0.5 gap-y-1 sm:gap-x-1 sm:gap-y-1.5">
                {cells.map(({ date, inCurrentMonth }) => {
                  const dateKey = toDateKey(date);
                  const holidayName = HOLIDAY_MARKERS[toMonthDayKey(date)];
                  const hasHoliday = Boolean(holidayName);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isStart = isSameDay(date, startDate);
                  const isEnd = isSameDay(date, endDate);
                  const inRange = isDateBetween(
                    date,
                    previewRange.rangeStart,
                    previewRange.rangeEnd
                  );

                  const baseTextColor = !inCurrentMonth
                    ? "#D0D3D8"
                    : isWeekend
                    ? ACCENT
                    : "#353535";

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onMouseEnter={() => {
                        handleDayHover(date);
                        handleDayPointerEnter(date);
                      }}
                      onPointerDown={() => handleDayPointerDown(date)}
                      onPointerUp={() => finishPointerSelection(date)}
                      className={cx(
                        "relative flex h-8.5 touch-manipulation items-center justify-center rounded-[9px] text-[0.95rem] font-semibold transition sm:h-9.5 sm:rounded-[10px] sm:text-[1.02rem]",
                        inCurrentMonth
                          ? "cursor-pointer"
                          : "cursor-pointer opacity-75"
                      )}
                      style={{ color: isStart || isEnd ? "#fff" : baseTextColor }}
                      aria-label={`${fullDateFormatter.format(date)}${
                        holidayName ? `, ${holidayName}` : ""
                      }`}
                    >
                      {inRange && !isStart && !isEnd && (
                        <span className="absolute inset-x-1 inset-y-[3px] rounded-md bg-[#E7F4FC]" />
                      )}
                      {(isStart || isEnd) && (
                        <span className="absolute inset-[3px] rounded-full text-white" style={{ backgroundColor: ACCENT, boxShadow: `0 4px 10px ${ACCENT}60` }} />
                      )}
                      <span className="relative z-10">{date.getDate()}</span>
                      {hasHoliday && (
                        <span
                          className={cx(
                            "absolute right-[6px] top-[6px] h-1.5 w-1.5 rounded-full",
                            isStart || isEnd ? "bg-white" : "bg-[rgba(0,0,0,0.4)]"
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                {(startDate || endDate) ? (
                  <button
                    onClick={clearSelection}
                    type="button"
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a7a7a] hover:text-[#4e4e4e]"
                  >
                    Clear Selection
                  </button>
                ) : (
                  <span />
                )}
                <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7f828a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/40" />
                  Holiday Marker
                </span>
              </div>
            </section>
          </div>
        </motion.article></AnimatePresence></div>

        <div className="relative z-20 mt-[-1px] flex h-[52px] w-full items-center justify-between rounded-b-[8px] bg-[#eceff2] px-8 shadow-[0_10px_24px_rgba(0,0,0,0.08)] border border-[#d7d7dc] border-t-0">
          <button
            type="button"
            onClick={() => setMonthWithOffset(-1)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d6f77] transition" style={{ "--hover-color": ACCENT } as React.CSSProperties} onMouseEnter={(e) => ((e.target as HTMLElement).style.color = ACCENT)} onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6d6f77")}
          >
            ← PREV
          </button>
          
          <button
            type="button"
            onClick={goToCurrentMonth}
            className="flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b8b90] transition hover:text-[#43454b] px-3.5 py-1.5 rounded-md bg-[#e4e5e8]"
          >
            TODAY
          </button>

          <button
            type="button"
            onClick={() => setMonthWithOffset(1)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d6f77] transition" style={{ "--hover-color": ACCENT } as React.CSSProperties} onMouseEnter={(e) => ((e.target as HTMLElement).style.color = ACCENT)} onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6d6f77")}
          >
            NEXT →
          </button>
        </div>
      </section>
    </main>
  );
}