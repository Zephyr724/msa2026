import { useState, useEffect, useCallback, useRef } from "react";
import {
  Leaf, Bird, Trash2, Sprout, Eye, BookOpen, MapPin, Calendar,
  Clock, Users, Zap, ChevronRight, ChevronLeft, X, Sun, Moon,
  Search, Map, Share2, Download, Check, Shield,
  CheckCircle2, XCircle, TrendingUp, Trophy, Flame,
  Target, ArrowRight, ExternalLink, Info, LogIn,
  Compass, Award, Star, Menu, LayoutGrid, Layers, Globe,
  RefreshCw, Lock, BarChart2, Wifi, WifiOff, SlidersHorizontal,
  Sparkles, SkipForward, ChevronDown, ChevronUp,
  Minus, VolumeX, Play, Home, Activity, ArrowUpRight,
  HelpCircle, Image
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Page = "landing" | "discover" | "quest-detail" | "my-quests" | "passport" | "leaderboard" | "share-card";
type CompletionStep = "choose" | "code" | "code-loading" | "code-error" | "claim" | "claim-submitted" | "self" | "self-done" | "success";
type QuestTab = "upcoming" | "awaiting" | "review" | "completed";
type LBGeo = "my-community" | "auckland" | "new-zealand";
type LBTime = "weekly" | "monthly" | "alltime";
type LBType = "people" | "communities";
type LBStatus = "live" | "reconnecting" | "unavailable";
type CardTheme = "nature" | "wildlife" | "waste";
type CardColorScheme = "light" | "dark";

interface Quest {
  id: number; title: string; category: string; organizer: string;
  date: string; location: string; difficulty: "Easy" | "Medium" | "Hard";
  xp: 50 | 100 | 150;
  source: "Official external event" | "Organizer quest" | "Kiwimpact challenge";
  verification: "Completion code" | "Evidence reviewed" | "Self reported · No XP";
  capacity?: number; spotsLeft?: number; description: string;
  whatToExpect: string; duration: string; eligibility: string;
  memberStatus?: "joined" | "awaiting" | "review" | "completed";
  community?: string;
  imageId: string;
  tags?: string[];
}

// ── Image Sources ─────────────────────────────────────────────────────────────
// All images sourced from Unsplash (unsplash.com) under the Unsplash License.
// Temporary prototype content. For production, download and serve locally.

const IMG = {
  quest1: "https://images.unsplash.com/photo-1668010881202-7914b6d9a2e3?w=800&q=75&fit=crop&crop=center",
  quest2: "https://images.unsplash.com/photo-1624123795368-2d6b47743fa9?w=800&q=75&fit=crop&crop=center",
  quest3: "https://images.unsplash.com/photo-1616680214084-22670de1bc82?w=800&q=75&fit=crop&crop=center",
  quest4: "https://images.unsplash.com/photo-1764786076566-9e0bff25dbc0?w=800&q=75&fit=crop&crop=center",
  quest5: "https://images.unsplash.com/photo-1632722973264-30112cefb7fb?w=800&q=75&fit=crop&crop=center",
  quest6: "https://images.unsplash.com/photo-1555069855-e580a9adbf43?w=800&q=75&fit=crop&crop=center",
  community: "https://images.unsplash.com/photo-1621353880794-62c849b1eb36?w=1200&q=80&fit=crop&crop=center",
  hero: "https://images.unsplash.com/photo-1616680214084-22670de1bc82?w=1400&q=80&fit=crop&crop=entropy",
};

// ── Data ─────────────────────────────────────────────────────────────────────

const QUESTS: Quest[] = [
  { id: 1, title: "Restore the Harbour Edge", category: "Restore Nature", organizer: "Green Auckland Collective", date: "Sat 26 Jul, 9:00 AM", location: "West Auckland", community: "Henderson-Massey", difficulty: "Medium", xp: 100, source: "Organizer quest", verification: "Completion code", capacity: 30, spotsLeft: 7, description: "Join the Green Auckland Collective for a morning of native planting along the upper Waitemata Harbour edge. All tools and gloves are provided.", whatToExpect: "You'll be planting harakeke and kānuka alongside experienced volunteers. Wear sturdy shoes and bring water.", duration: "3 hours", eligibility: "All ages welcome. Under 16s must be accompanied by an adult.", memberStatus: "joined", imageId: "quest1", tags: ["Recommended for you"] },
  { id: 2, title: "Backyard Bird Count", category: "Observe & Measure", organizer: "Kiwimpact", date: "Any time", location: "Anywhere in Auckland", difficulty: "Easy", xp: 50, source: "Kiwimpact challenge", verification: "Evidence reviewed", description: "Spend 20 minutes in your backyard or local park counting and recording bird species. Upload your tally and a photo as evidence.", whatToExpect: "A peaceful solo activity. Use the provided species guide to identify common Auckland birds.", duration: "20–30 minutes", eligibility: "Anyone", memberStatus: "awaiting", imageId: "quest2", tags: ["Good first Quest"] },
  { id: 3, title: "Neighbourhood Litter Sweep", category: "Clean & Reduce Waste", organizer: "Mount Eden Residents Group", date: "Sun 27 Jul, 8:30 AM", location: "Mount Eden", community: "Albert-Eden", difficulty: "Easy", xp: 50, source: "Organizer quest", verification: "Completion code", capacity: 20, spotsLeft: 3, description: "A Sunday morning litter pick covering four blocks around Mount Eden Village. Bags and gloves are supplied.", whatToExpect: "Meet at the corner of Dominion Rd and Valley Rd. Ends with a free coffee voucher.", duration: "1.5 hours", eligibility: "All ages welcome", imageId: "quest3", tags: ["Almost full"] },
  { id: 4, title: "Pollinator Garden Workshop", category: "Grow & Compost", organizer: "Auckland Botanic Gardens", date: "Sat 2 Aug, 10:00 AM", location: "Central Auckland", community: "Māngere-Ōtāhuhu", difficulty: "Medium", xp: 100, source: "Official external event", verification: "Evidence reviewed", capacity: 15, spotsLeft: 3, description: "Learn to design and plant a pollinator-friendly garden at home. Run by the Auckland Botanic Gardens horticulture team.", whatToExpect: "A 2-hour hands-on workshop. Take home a seedling kit.", duration: "2 hours", eligibility: "Ages 16+", imageId: "quest4", tags: ["Almost full"] },
  { id: 5, title: "Wildlife-Friendly Beach Walk", category: "Protect Wildlife", organizer: "Kiwimpact", date: "Any time", location: "North Shore", community: "Henderson-Massey", difficulty: "Easy", xp: 50, source: "Kiwimpact challenge", verification: "Self reported · No XP", description: "Walk a North Shore beach following wildlife-safe guidelines: stay 20 m from birds, keep dogs leashed, carry out all litter.", whatToExpect: "A relaxing solo or family activity. Use our checklist to record what you observe.", duration: "45–90 minutes", eligibility: "Anyone", imageId: "quest5", tags: ["Good first Quest"] },
  { id: 6, title: "Share a Waste-Free Habit", category: "Learn & Share", organizer: "Kiwimpact", date: "Any time", location: "Online / Auckland", difficulty: "Easy", xp: 50, source: "Kiwimpact challenge", verification: "Evidence reviewed", description: "Post a short video or written guide teaching one waste-free habit you practise at home.", whatToExpect: "Express yourself in your own words. Evidence is reviewed by our team and stays private.", duration: "30–60 minutes", eligibility: "Anyone", imageId: "quest6" },
];

const LB_DATA = [
  { rank: 1, name: "Aroha T.",  level: 31, rankTitle: "Ranger",     xp: 3240, quests: 28, av: "AT", prev: 1 },
  { rank: 2, name: "Callum F.", level: 29, rankTitle: "Adventurer", xp: 2980, quests: 24, av: "CF", prev: 3 },
  { rank: 3, name: "Ngaio W.",  level: 27, rankTitle: "Adventurer", xp: 2750, quests: 22, av: "NW", prev: 2 },
  { rank: 4, name: "Theo R.",   level: 12, rankTitle: "Scout",      xp: 1820, quests: 18, av: "TR", prev: 4 },
  { rank: 5, name: "Priya K.",  level: 19, rankTitle: "Scout",      xp: 1640, quests: 15, av: "PK", prev: 6 },
  { rank: 6, name: "Sam B.",    level: 16, rankTitle: "Scout",      xp: 1420, quests: 13, av: "SB", prev: 5 },
  { rank: 7, name: "Anika P.",  level: 24, rankTitle: "Adventurer", xp: 1380, quests: 11, av: "AP", prev: 7 },
  { rank: 8, name: "Dom L.",    level: 14, rankTitle: "Scout",      xp: 1200, quests: 10, av: "DL", prev: 9 },
  { rank: 9, name: "Fiona R.",  level: 11, rankTitle: "Scout",      xp: 1050, quests: 9,  av: "FR", prev: 8 },
  { rank: 10, name: "James H.", level: 9,  rankTitle: "Novice",     xp: 920,  quests: 8,  av: "JH", prev: 10 },
];

const COMMUNITY_LB = [
  { rank: 1, name: "Mia K.",   level: 7, rankTitle: "Novice", xp: 420, quests: 5, av: "MK", prev: 2, isMe: true },
  { rank: 2, name: "James H.", level: 9, rankTitle: "Novice", xp: 380, quests: 4, av: "JH", prev: 1 },
  { rank: 3, name: "Lena S.",  level: 5, rankTitle: "Novice", xp: 250, quests: 3, av: "LS", prev: 3 },
  { rank: 4, name: "Omar F.",  level: 4, rankTitle: "Novice", xp: 150, quests: 2, av: "OF", prev: 4 },
];

// Community-to-community comparison data
const COMMUNITY_COMPARISON = [
  { rank: 1, name: "Henderson-Massey", quests: 42, contributors: 18, categories: 6, avgPerMember: 2.3, isHome: true },
  { rank: 2, name: "Albert-Eden",      quests: 38, contributors: 22, categories: 5, avgPerMember: 1.7 },
  { rank: 3, name: "Waitematā",        quests: 35, contributors: 28, categories: 6, avgPerMember: 1.25 },
  { rank: 4, name: "Kaipātiki",        quests: 29, contributors: 15, categories: 4, avgPerMember: 1.9 },
  { rank: 5, name: "Māngere-Ōtāhuhu", quests: 22, contributors: 19, categories: 4, avgPerMember: 1.2 },
  { rank: 6, name: "Manurewa",         quests: 18, contributors: 12, categories: 3, avgPerMember: 1.5 },
];

const CURRENT_USER_LB = { rank: 18, name: "Mia K.", level: 7, rankTitle: "Novice", xp: 420, quests: 5, av: "MK", personalBest: 14, prev: 21, nextRankXp: 570 };

const ACHIEVEMENTS = [
  { id: "first-step",   name: "First Step",        desc: "Complete your first quest",        earned: true,  progress: 1, total: 1,  category: "Restore Nature" },
  { id: "local-helper", name: "Local Helper",       desc: "Complete 5 quests",                earned: true,  progress: 5, total: 5,  category: "Clean & Reduce Waste" },
  { id: "nature-rest",  name: "Nature Restorer",    desc: "3 Restore Nature quests",          earned: false, progress: 2, total: 3,  category: "Restore Nature" },
  { id: "wildlife",     name: "Wildlife Ally",      desc: "Complete a Protect Wildlife quest",earned: false, progress: 0, total: 1,  category: "Protect Wildlife" },
  { id: "waste-war",    name: "Waste Warrior",      desc: "3 Clean & Reduce Waste quests",    earned: false, progress: 1, total: 3,  category: "Clean & Reduce Waste" },
  { id: "citizen-obs",  name: "Citizen Observer",   desc: "2 Observe & Measure quests",       earned: false, progress: 1, total: 2,  category: "Observe & Measure" },
  { id: "five-streak",  name: "Five-Quest Streak",  desc: "Verify 5 quests in 5 weeks",       earned: false, progress: 3, total: 5,  category: "Learn & Share" },
  { id: "pathfinder",   name: "Auckland Pathfinder",desc: "Quests in 4 different locations",  earned: false, progress: 2, total: 4,  category: "Observe & Measure" },
];

const TIMELINE = [
  { id: 1, title: "Neighbourhood Litter Sweep", category: "Clean & Reduce Waste", date: "13 Jul 2026", verified: true,  xp: 50,  achievement: "Local Helper", imageId: "quest3" },
  { id: 2, title: "Backyard Bird Count",         category: "Observe & Measure",    date: "6 Jul 2026",  verified: true,  xp: 50,  achievement: null,           imageId: "quest2" },
  { id: 3, title: "Wildlife-Friendly Beach Walk",category: "Protect Wildlife",      date: "29 Jun 2026", verified: false, xp: 0,   achievement: null,           imageId: "quest5" },
  { id: 4, title: "Restore the Harbour Edge",    category: "Restore Nature",        date: "21 Jun 2026", verified: true,  xp: 100, achievement: null,           imageId: "quest1" },
  { id: 5, title: "Share a Waste-Free Habit",    category: "Learn & Share",         date: "14 Jun 2026", verified: true,  xp: 50,  achievement: "First Step",   imageId: "quest6" },
];

const COMMUNITY_CHALLENGE_HISTORY = [
  { id: 1, challenge: "Henderson-Massey July Challenge", date: "Jul 2026", status: "in-progress", contributed: true, questCount: 1, badge: null },
];

const CAT_QUEST_COUNTS: Record<string, { verified: number; total: number }> = {
  "Restore Nature":       { verified: 2, total: 3 },
  "Protect Wildlife":     { verified: 0, total: 1 },
  "Clean & Reduce Waste": { verified: 1, total: 3 },
  "Grow & Compost":       { verified: 0, total: 3 },
  "Observe & Measure":    { verified: 1, total: 2 },
  "Learn & Share":        { verified: 1, total: 3 },
};

const CAT_XP: Record<string, number> = {
  "Restore Nature": 100, "Protect Wildlife": 0, "Clean & Reduce Waste": 50,
  "Grow & Compost": 0, "Observe & Measure": 50, "Learn & Share": 50,
};

const CATS = ["Restore Nature", "Protect Wildlife", "Clean & Reduce Waste", "Grow & Compost", "Observe & Measure", "Learn & Share"];

const CAT_CFG: Record<string, { color: string; bg: string; dcolor: string; dbg: string; border: string; icon: any; accent: string; fill: string }> = {
  "Restore Nature":       { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200",  dcolor: "dark:text-emerald-300", dbg: "dark:bg-emerald-900/30", icon: Leaf,     accent: "#2F8F5B", fill: "#2F8F5B" },
  "Protect Wildlife":     { color: "text-sky-700",     bg: "bg-sky-50",      border: "border-sky-200",      dcolor: "dark:text-sky-300",     dbg: "dark:bg-sky-900/30",     icon: Bird,     accent: "#3C72C9", fill: "#3C72C9" },
  "Clean & Reduce Waste": { color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",   dcolor: "dark:text-orange-300",  dbg: "dark:bg-orange-900/30",  icon: Trash2,   accent: "#C74444", fill: "#C74444" },
  "Grow & Compost":       { color: "text-lime-700",    bg: "bg-lime-50",     border: "border-lime-200",     dcolor: "dark:text-lime-300",    dbg: "dark:bg-lime-900/30",    icon: Sprout,   accent: "#6C8F2F", fill: "#6C8F2F" },
  "Observe & Measure":    { color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200",   dcolor: "dark:text-violet-300",  dbg: "dark:bg-violet-900/30",  icon: Eye,      accent: "#6C63D9", fill: "#6C63D9" },
  "Learn & Share":        { color: "text-pink-700",    bg: "bg-pink-50",     border: "border-pink-200",     dcolor: "dark:text-pink-300",    dbg: "dark:bg-pink-900/30",    icon: BookOpen, accent: "#C963D9", fill: "#C963D9" },
};

const DIFF_CFG = {
  Easy:   { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-700" },
  Medium: { color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/30",     border: "border-amber-200 dark:border-amber-700" },
  Hard:   { color: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/30",         border: "border-red-200 dark:border-red-700" },
};

// Rank ladder
const RANK_LADDER = [
  { title: "Novice",     levels: "Levels 1–9",  color: "#5A7A65", desc: "You've taken your first steps as an eco quest participant." },
  { title: "Scout",      levels: "Levels 10–19", color: "#3C72C9", desc: "You've shown commitment and consistency across multiple quests." },
  { title: "Adventurer", levels: "Levels 20–29", color: "#D4A020", desc: "You're a seasoned contributor with a broad range of impact." },
  { title: "Ranger",     levels: "Levels 30–39", color: "#2F8F5B", desc: "You're a recognised environmental champion in your community." },
];

// ── Gameful Icon System ───────────────────────────────────────────────────────

function CategoryEmblem({ category, size = 44, className = "" }: { category: string; size?: number; className?: string }) {
  const s = size;
  const emblems: Record<string, React.ReactNode> = {
    "Restore Nature": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Restore Nature emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#2F8F5B"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#38A868" opacity="0.55"/>
        <path d="M22 9C22 9 32 14 32 23C32 30 27 35 22 35C17 35 12 30 12 23C12 14 22 9 22 9Z" fill="#A3E8C0"/>
        <path d="M22 12C22 12 29 16 29 23C29 29 26 33 22 33C18 33 15 29 15 23C15 16 22 12 22 12Z" fill="#6FD69A"/>
        <line x1="22" y1="13" x2="22" y2="33" stroke="#2F8F5B" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="22" y1="21" x2="27" y2="17" stroke="#2F8F5B" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="26" x2="17" y2="22" stroke="#2F8F5B" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    "Protect Wildlife": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Protect Wildlife emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#3C72C9"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#4D84DB" opacity="0.55"/>
        <path d="M8 24C12 18 17 20 22 22C27 20 32 18 36 24" stroke="#BAD4FF" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M8 24C10 17 16 13 22 17C28 13 34 17 36 24" fill="#8DB7FF" opacity="0.65"/>
        <circle cx="22" cy="18" r="3.5" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="22" cy="18" r="1.8" fill="#3C72C9"/>
      </svg>
    ),
    "Clean & Reduce Waste": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Clean & Reduce Waste emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#C74444"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#D95555" opacity="0.55"/>
        <path d="M22 10 L26.5 18 L17.5 18 Z" fill="#FFB4A0"/>
        <path d="M30 17 L34 22 L30 27" stroke="#FFB4A0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 27 L10 22 L14 17" stroke="#FFB4A0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 34 L17.5 26 L26.5 26 Z" fill="#FFB4A0"/>
        <circle cx="22" cy="22" r="4" fill="#FF8B8B" opacity="0.7"/>
        <circle cx="22" cy="22" r="2" fill="#FFFFFF" opacity="0.9"/>
      </svg>
    ),
    "Grow & Compost": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Grow & Compost emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#6C8F2F"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#7DA337" opacity="0.55"/>
        <rect x="20" y="24" width="4" height="10" rx="2" fill="#C8E89A"/>
        <path d="M22 24C22 19 13 15 11 11C14 11 20 15 22 19" fill="#9ED45A"/>
        <path d="M22 24C22 19 31 15 33 11C30 11 24 15 22 19" fill="#BCEC82"/>
        <path d="M22 21C22 18 18 14 22 12C26 14 22 18 22 21Z" fill="#E0F5B0"/>
        <ellipse cx="22" cy="34" rx="9" ry="3" fill="#4A6020" opacity="0.55"/>
      </svg>
    ),
    "Observe & Measure": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Observe & Measure emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#6C63D9"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#7D75E5" opacity="0.55"/>
        <ellipse cx="22" cy="22" rx="12" ry="8" fill="#AAA1F5" opacity="0.4"/>
        <ellipse cx="22" cy="22" rx="12" ry="8" stroke="#C8C3FF" strokeWidth="2" fill="none"/>
        <circle cx="22" cy="22" r="5.5" fill="#9490FF"/>
        <circle cx="22" cy="22" r="3.5" fill="#FFFFFF" opacity="0.95"/>
        <circle cx="22" cy="22" r="2" fill="#6C63D9"/>
        <circle cx="23.5" cy="20.5" r="0.9" fill="#FFFFFF"/>
      </svg>
    ),
    "Learn & Share": (
      <svg width={s} height={s} viewBox="0 0 44 44" className={className} aria-label="Learn & Share emblem">
        <rect x="2" y="2" width="40" height="40" rx="12" fill="#C963D9"/>
        <rect x="5" y="5" width="34" height="34" rx="9" fill="#D974E6" opacity="0.55"/>
        <rect x="10" y="14" width="10" height="16" rx="2.5" fill="#F5C8FF"/>
        <rect x="24" y="14" width="10" height="16" rx="2.5" fill="#EAA3FF"/>
        <rect x="20" y="13" width="4" height="18" rx="1.5" fill="#FFFFFF" opacity="0.75"/>
        <line x1="12" y1="18" x2="18" y2="18" stroke="#C963D9" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="21" x2="18" y2="21" stroke="#C963D9" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="16" y2="24" stroke="#C963D9" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="26" y1="18" x2="32" y2="18" stroke="#C963D9" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="26" y1="21" x2="32" y2="21" stroke="#C963D9" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };
  return <>{emblems[category] || emblems["Restore Nature"]}</>;
}

function RankCrest({ rankTitle, size = 44 }: { rankTitle: string; size?: number }) {
  const s = size;
  const crests: Record<string, React.ReactNode> = {
    "Novice": (
      <svg width={s} height={s} viewBox="0 0 44 44" aria-label="Novice rank crest">
        <path d="M22 3L37 9V24C37 32 30 38 22 41C14 38 7 32 7 24V9Z" fill="#5A7A65"/>
        <path d="M22 5L35 10.5V24C35 31 28.5 37 22 39.5C15.5 37 9 31 9 24V10.5Z" fill="#7A9A85" opacity="0.45"/>
        <path d="M22 13C22 13 18 17 18 21C18 24 20 27 22 27C24 27 26 24 26 21C26 17 22 13 22 13Z" fill="#9DB5A4"/>
        <line x1="22" y1="14" x2="22" y2="26" stroke="#C8DDD4" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="19" y1="20" x2="25" y2="20" stroke="#C8DDD4" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    "Scout": (
      <svg width={s} height={s} viewBox="0 0 44 44" aria-label="Scout rank crest">
        <path d="M22 3L37 9V24C37 32 30 38 22 41C14 38 7 32 7 24V9Z" fill="#3C72C9"/>
        <path d="M22 5L35 10.5V24C35 31 28.5 37 22 39.5C15.5 37 9 31 9 24V10.5Z" fill="#5D93E6" opacity="0.45"/>
        <circle cx="22" cy="21" r="7" fill="#8DB7FF" opacity="0.35"/>
        <path d="M22 14L23.8 18.5L28.5 18.9L25 21.8L26.2 26.4L22 23.6L17.8 26.4L19 21.8L15.5 18.9L20.2 18.5Z" fill="#BAD4FF"/>
      </svg>
    ),
    "Adventurer": (
      <svg width={s} height={s} viewBox="0 0 44 44" aria-label="Adventurer rank crest">
        <path d="M22 3L37 9V24C37 32 30 38 22 41C14 38 7 32 7 24V9Z" fill="#D4A020"/>
        <path d="M22 5L35 10.5V24C35 31 28.5 37 22 39.5C15.5 37 9 31 9 24V10.5Z" fill="#F4C840" opacity="0.45"/>
        <path d="M13 28L22 12L31 28Z" fill="#FFD166" opacity="0.55"/>
        <path d="M15 28L22 14L29 28Z" fill="#FFE599"/>
        <line x1="13" y1="28" x2="31" y2="28" stroke="#D4A020" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    "Ranger": (
      <svg width={s} height={s} viewBox="0 0 44 44" aria-label="Ranger rank crest">
        <path d="M22 3L37 9V24C37 32 30 38 22 41C14 38 7 32 7 24V9Z" fill="#2F8F5B"/>
        <path d="M22 5L35 10.5V24C35 31 28.5 37 22 39.5C15.5 37 9 31 9 24V10.5Z" fill="#3BA868" opacity="0.45"/>
        <circle cx="22" cy="21" r="7.5" fill="#6FD69A" opacity="0.4"/>
        <path d="M22 13L24.2 18L29.5 18.5L25.5 22L26.8 27.2L22 24.5L17.2 27.2L18.5 22L14.5 18.5L19.8 18Z" fill="#A3E8C0"/>
        <circle cx="22" cy="21" r="2.5" fill="#FFFFFF" opacity="0.8"/>
      </svg>
    ),
  };
  return <>{crests[rankTitle] || crests["Novice"]}</>;
}

function AchievementBadgeSVG({ achievement, size = 52 }: { achievement: typeof ACHIEVEMENTS[0]; size?: number }) {
  const s = size;
  const cfg = CAT_CFG[achievement.category] || CAT_CFG["Restore Nature"];
  const fill = cfg.fill;
  const symbols: Record<string, React.ReactNode> = {
    "first-step":  <path d="M24 14C24 14 20 17 20 21C20 24 22 27 24 27C26 27 28 24 28 21C28 17 24 14 24 14ZM24 16L24 25M21 20L27 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>,
    "local-helper":<><circle cx="24" cy="18" r="3" fill="white" opacity="0.9"/><path d="M17 28C17 24 20 22 24 22C28 22 31 24 31 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></>,
    "nature-rest": <><path d="M24 13C24 13 20 16 20 20C20 23 22 25 24 25" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M24 15C24 15 28 18 28 22C28 25 26 27 24 27" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8"/></>,
    "wildlife":    <path d="M14 24C18 19 21 21 24 23C27 21 30 19 34 24M14 24C16 18 20 15 24 18C28 15 32 18 34 24" fill="white" opacity="0.9"/>,
    "waste-war":   <><path d="M24 13L27 18L21 18Z" fill="white" opacity="0.9"/><path d="M24 35L21 30L27 30Z" fill="white" opacity="0.9"/><path d="M13 24L18 21L18 27Z" fill="white" opacity="0.75"/><path d="M35 24L30 21L30 27Z" fill="white" opacity="0.75"/></>,
    "citizen-obs": <><ellipse cx="24" cy="23" rx="9" ry="6" stroke="white" strokeWidth="1.8" fill="none"/><circle cx="24" cy="23" r="3" fill="white" opacity="0.9"/><circle cx="24" cy="23" r="1.5" fill={fill}/></>,
    "five-streak": <path d="M24 12C24 12 22 18 20 20C18 22 16 21 16 24C16 27 19 30 24 30C29 30 32 27 32 24C32 21 30 22 28 20C26 18 24 12 24 12Z" fill="white" opacity="0.9"/>,
    "pathfinder":  <><circle cx="24" cy="23" r="7" stroke="white" strokeWidth="1.8" fill="none" opacity="0.7"/><line x1="24" y1="14" x2="24" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="24" y1="26" x2="24" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="23" x2="21" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="27" y1="23" x2="33" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/></>,
  };
  const locked = !achievement.earned;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" aria-label={`${achievement.name} badge${locked ? " (locked)" : " (earned)"}`}>
      <path d="M24 4L41 13V31L24 44L7 31V13Z" fill={locked ? "#CBD5CC" : fill}/>
      <path d="M24 7L38.5 15V29L24 41L9.5 29V15Z" fill={locked ? "#D8DFD9" : fill} opacity="0.55"/>
      {locked ? <Lock size={20} x="14" y="14" color="#9BA5A0"/> : <g>{symbols[achievement.id]}</g>}
      <path d="M24 4L41 13V31L24 44L7 31V13Z" fill="none" stroke={locked ? "#B0BBB5" : "white"} strokeWidth="1.2" opacity="0.4"/>
    </svg>
  );
}

function MedalArtwork({ pos }: { pos: 1 | 2 | 3 }) {
  const configs = {
    1: { outer: "#D4A020", mid: "#F4B740", inner: "#FFE08A", txt: "#7A5800" },
    2: { outer: "#7A8C84", mid: "#9DB5A4", inner: "#C5D8CC", txt: "#3A5040" },
    3: { outer: "#A04020", mid: "#C87040", inner: "#E8A87A", txt: "#5A2810" },
  };
  const c = configs[pos];
  return (
    <svg width="44" height="50" viewBox="0 0 44 50" aria-label={`#${pos} medal`}>
      <path d="M16 4L22 12L28 4Z" fill={c.mid} opacity="0.85"/>
      <circle cx="22" cy="33" r="16" fill={c.outer}/>
      <circle cx="22" cy="33" r="13.5" fill={c.mid}/>
      <circle cx="22" cy="33" r="11" fill={c.inner}/>
      <text x="22" y="38.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={c.txt} fontFamily="Fredoka, system-ui, sans-serif">{pos}</text>
    </svg>
  );
}

// ── Quest Image Component ─────────────────────────────────────────────────────

function QuestImage({ imageId, alt, className = "", overlay }: { imageId: string; alt: string; className?: string; overlay?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const url = IMG[imageId as keyof typeof IMG];
  return (
    <div className={`relative overflow-hidden bg-secondary ${className}`}>
      {!loaded && !error && <div className="absolute inset-0 bg-gradient-to-r from-border via-secondary to-border animate-pulse"/>}
      {!error && (
        <img src={url} alt={alt} loading="lazy"
          onLoad={() => setLoaded(true)} onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}/>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Image size={24} className="text-muted-foreground/40"/>
        </div>
      )}
      {overlay && <div className={`absolute inset-0 ${overlay}`}/>}
    </div>
  );
}

// ── Quest Detail Image Gallery ────────────────────────────────────────────────

function QuestDetailGallery({ questId }: { questId: number }) {
  const allIds = ["quest1","quest2","quest3","quest4","quest5","quest6"] as const;
  const primary = `quest${questId}` as keyof typeof IMG;
  const extras = allIds.filter(id => id !== primary).slice(0, 4);
  const [idx, setIdx] = useState(0);

  return (
    <div>
      <h2 className="font-medium text-lg text-foreground mb-3 font-display flex items-center gap-2">
        <Image size={16} className="text-primary" strokeWidth={2.5}/>Gallery
      </h2>
      <div className="relative rounded-[16px] overflow-hidden">
        <QuestImage imageId={extras[idx]} alt={`Gallery image ${idx + 1}`} className="h-52"/>
        <button onClick={() => setIdx(i => (i - 1 + extras.length) % extras.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-card transition-colors">
          <ChevronLeft size={16} className="text-foreground"/>
        </button>
        <button onClick={() => setIdx(i => (i + 1) % extras.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-card transition-colors">
          <ChevronRight size={16} className="text-foreground"/>
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {extras.map((_,i) => <div key={i} className={`h-1.5 rounded-full transition-all bg-white/70 ${i===idx?"w-3":"w-1.5"}`}/>)}
        </div>
      </div>
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
        {extras.map((id, i) => (
          <button key={id} onClick={() => setIdx(i)} className={`shrink-0 w-16 h-12 rounded-[10px] overflow-hidden border-2 transition-all ${i===idx?"border-primary":"border-transparent"}`}>
            <QuestImage imageId={id} alt={`Thumbnail ${i+1}`} className="w-full h-full"/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Player Status Capsule ─────────────────────────────────────────────────────

function PlayerStatusCapsule({ onClick, compact }: { onClick?: () => void; compact?: boolean }) {
  const wrap = compact
    ? "flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-3 py-1.5 hover:opacity-80 transition-opacity cursor-pointer"
    : "bg-card border border-border rounded-[20px] p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer";
  return (
    <div className={wrap} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onClick?.()} aria-label="Open Passport">
      <RankCrest rankTitle="Novice" size={compact ? 28 : 44}/>
      {compact ? (
        <>
          <Zap size={12} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5}/>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-display">420 XP · Lv 7</span>
        </>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="font-medium text-base text-foreground font-display">Mia K.</p>
            <span className="text-xs font-semibold text-primary">Lv 7</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Novice · 3-week streak</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-semibold">420 XP</span>
              <span>525 XP next level</span>
            </div>
            <PBar val={420} max={525} h="h-2"/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Level & Rank Detail Modal ─────────────────────────────────────────────────

function LevelDetailModal({ onClose }: { onClose: () => void }) {
  const currentLevel = 7;
  const currentRank = "Novice";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-card w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-xl text-foreground font-display">Level & Rank</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"><X size={16}/></button>
        </div>

        <div className="bg-secondary rounded-[16px] p-4 flex items-center gap-4">
          <RankCrest rankTitle="Novice" size={52}/>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Current rank</p>
            <h4 className="font-medium text-lg text-foreground font-display">Novice · Level {currentLevel}</h4>
            <p className="text-xs text-muted-foreground mt-1">420 XP — 105 XP to Level 8</p>
            <PBar val={420} max={525} h="h-2" cls="mt-2"/>
          </div>
        </div>

        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-[16px] p-4 flex items-center gap-4">
          <RankCrest rankTitle="Scout" size={44}/>
          <div>
            <p className="text-xs text-sky-700 dark:text-sky-400 font-bold uppercase tracking-widest mb-0.5">Next rank</p>
            <p className="font-medium text-foreground font-display">Scout starts at Level 10</p>
            <p className="text-xs text-muted-foreground mt-0.5">3 more levels to go</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Full rank ladder</p>
          <div className="space-y-2">
            {RANK_LADDER.map(r => {
              const isCurrent = r.title === currentRank;
              return (
                <div key={r.title} className={`flex items-center gap-3 p-3 rounded-[14px] border transition-colors ${isCurrent ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <RankCrest rankTitle={r.title} size={36}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground font-display">{r.title}</p>
                      {isCurrent && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">You are here</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.levels}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-secondary rounded-[14px] p-3 text-xs text-muted-foreground">
          Complete verified quests to earn XP and level up. Each rank unlocks at a new level milestone.
        </div>
      </div>
    </div>
  );
}

// ── Community Challenge Detail Modal ─────────────────────────────────────────

function ChallengeDetailModal({ onClose, community = "Henderson-Massey" }: { onClose: () => void; community?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-card w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-xl text-foreground font-display">Community Challenge</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"><X size={16}/></button>
        </div>

        <div className="rounded-[16px] overflow-hidden">
          <QuestImage imageId="community" alt="Community members working together" className="h-36"/>
        </div>

        <div className="space-y-1">
          <h4 className="font-medium text-lg text-foreground font-display">{community} — July 2026</h4>
          <p className="text-sm text-muted-foreground">Complete 50 verified quests in July as a community.</p>
        </div>

        <div className="space-y-2">
          <PBar val={42} max={50} h="h-3"/>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-primary font-display">42 / 50</span>
            <span className="text-muted-foreground">8 quests remaining · 12 days left</span>
          </div>
        </div>

        {[
          { icon: HelpCircle, q: "What is this?", a: `A shared monthly goal for all ${community} members. The whole community works together to reach 50 verified quest completions in July.` },
          { icon: CheckCircle2, q: "How do I contribute?", a: `Any verified quest you complete in ${community} during July automatically counts toward the community goal. No extra steps needed.` },
          { icon: Shield, q: "What counts?", a: "Only verified completions (completion code or approved evidence claim) count. Self-reported completions do not count." },
          { icon: Zap, q: "Where does the progress come from?", a: "Every member's verified quest completions in this community are counted together in real time." },
          { icon: Award, q: "What's the reward?", a: "When the community reaches 50 verified quests, every member who contributed at least 1 verified quest unlocks the Local Changemakers badge." },
        ].map(({ icon: Icon, q, a }) => (
          <div key={q} className="border border-border rounded-[14px] p-4 space-y-1.5">
            <div className="flex items-center gap-2"><Icon size={14} className="text-primary shrink-0" strokeWidth={2.5}/><p className="text-xs font-bold text-foreground">{q}</p></div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5">{a}</p>
          </div>
        ))}

        <div className="bg-secondary rounded-[14px] p-4 flex items-center gap-3">
          <AchievementBadgeSVG achievement={{ id: "local-helper", name: "Local Changemakers", desc: "Community badge", earned: false, progress: 42, total: 50, category: "Restore Nature" }} size={44}/>
          <div>
            <p className="text-xs font-bold text-foreground">Reward: Local Changemakers</p>
            <p className="text-xs text-muted-foreground">Unlocked when community reaches 50 quests</p>
            <p className="text-xs text-muted-foreground">Your contributions: 1 verified quest</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Next Milestone Card ───────────────────────────────────────────────────────

function NextMilestoneCard({ type = "achievement" }: { type?: "achievement" | "rank" }) {
  if (type === "rank") {
    return (
      <div className="bg-card border border-border rounded-[20px] p-5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Next Rank</p>
        <div className="flex items-center gap-4">
          <RankCrest rankTitle="Scout" size={44}/>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground font-display">Scout</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Reach Level 10</p>
            <p className="text-xs text-muted-foreground">Level 7 / 10 · 3 levels remaining</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <PBar val={7} max={10} h="h-2.5"/>
          <p className="text-xs text-muted-foreground text-right">3 levels to go</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-[20px] p-5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Next Achievement</p>
      <div className="flex items-center gap-4">
        <AchievementBadgeSVG achievement={ACHIEVEMENTS[2]} size={44}/>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground font-display">Nature Restorer</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Complete 1 more Restore Nature Quest</p>
          <p className="text-xs text-muted-foreground">2 / 3 verified quests</p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <PBar val={2} max={3} h="h-2.5"/>
        <p className="text-xs text-primary font-semibold text-right">Reward: Nature Restorer badge</p>
      </div>
    </div>
  );
}

// ── Community Challenge Block ─────────────────────────────────────────────────

function CommunityChallenge({ compact, community = "Henderson-Massey", onViewDetails }: { compact?: boolean; community?: string; onViewDetails?: () => void }) {
  if (compact) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-[16px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground">{community} Challenge</p>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">12 days left</span>
        </div>
        <p className="text-xs text-muted-foreground">Any verified quest you complete in {community} in July automatically counts. Only verified completions count.</p>
        <PBar val={42} max={50} h="h-2.5"/>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-primary">42 / 50</span>
          <span className="text-muted-foreground">8 remaining</span>
        </div>
        {onViewDetails && (
          <button onClick={onViewDetails} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
            View challenge details<ChevronRight size={12}/>
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-[20px] overflow-hidden border border-border">
      <QuestImage imageId="community" alt="Community members working together outdoors" className="h-28"/>
      <div className="bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Community Challenge</p>
            <h3 className="font-medium text-foreground font-display">{community}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Complete 50 verified quests in July</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2.5 py-1">12 days left</span>
        </div>
        <PBar val={42} max={50} h="h-3"/>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-primary font-display">42 / 50</span>
          <span className="text-muted-foreground text-xs">8 quests remaining</span>
        </div>
        <div className="bg-secondary border border-border rounded-[12px] p-3 flex items-center gap-2.5">
          <AchievementBadgeSVG achievement={{ id: "local-helper", name: "Local Changemakers", desc: "Community badge", earned: false, progress: 42, total: 50, category: "Restore Nature" }} size={32}/>
          <div>
            <p className="text-xs font-bold text-foreground">Reward: Local Changemakers badge</p>
            <p className="text-xs text-muted-foreground">For all contributors when community reaches goal</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Any verified quest in {community} during July counts automatically.</p>
        {onViewDetails && (
          <button onClick={onViewDetails} className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
            View challenge details<ChevronRight size={14}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Primitive Components ──────────────────────────────────────────────────────
// Badge rule: light background · single 1px solid border · no transparency split

function CategoryBadge({ category, sm }: { category: string; sm?: boolean }) {
  const c = CAT_CFG[category] || CAT_CFG["Restore Nature"];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap border ${sm ? "text-[11px]" : "text-xs"} ${c.bg} ${c.color} ${c.border} ${c.dbg} ${c.dcolor}`}>
      <Icon size={sm ? 10 : 11} strokeWidth={2.5}/>{category}
    </span>
  );
}

function DiffBadge({ d }: { d: "Easy" | "Medium" | "Hard" }) {
  const c = DIFF_CFG[d];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.color} ${c.border}`}><Shield size={10} className="mr-1" strokeWidth={2.5}/>{d}</span>;
}

function VerifyBadge({ v, sm }: { v: string; sm?: boolean }) {
  const Icon = v === "Completion code" ? Shield : v === "Evidence reviewed" ? CheckCircle2 : Info;
  const cls = v === "Completion code"
    ? "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700"
    : v === "Evidence reviewed"
    ? "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700"
    : "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${sm ? "text-[11px]" : "text-xs"} ${cls}`}>
      <Icon size={10} strokeWidth={2.5}/>{v}
    </span>
  );
}

function XPPill({ xp, sm, lg }: { xp: number; sm?: boolean; lg?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 ${lg ? "text-base px-4 py-1.5" : sm ? "text-[11px] px-2 py-0.5" : "text-sm px-2.5 py-0.5"}`}>
      <Zap size={lg ? 16 : sm ? 10 : 12} strokeWidth={2.5}/>{xp} XP
    </span>
  );
}

function SourceChip({ source }: { source: string }) {
  const cls = source === "Official external event"
    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
    : source === "Kiwimpact challenge"
    ? "bg-emerald-50 text-primary border-emerald-200 dark:border-primary/40"
    : "bg-secondary text-muted-foreground border-border";
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${cls}`}>{source}</span>;
}

function TagChip({ tag }: { tag: string }) {
  const cls: Record<string, string> = {
    "Recommended for you": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
    "Good first Quest":    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    "Almost full":         "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${cls[tag] || "bg-secondary text-muted-foreground border-border"}`}>{tag}</span>;
}

function PBar({ val, max, h = "h-2.5", cls = "" }: { val: number; max: number; h?: string; cls?: string }) {
  return (
    <div className={`${h} rounded-full bg-border overflow-hidden ${cls}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(100, (val / max) * 100)}%` }}/>
    </div>
  );
}

function StatusChip({ s }: { s: string }) {
  const map: Record<string, string> = {
    "Joined":               "bg-primary/10 text-primary border-primary/30",
    "Completion available": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    "Pending review":       "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
    "Verified":             "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    "Self reported":        "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[s] || "bg-secondary text-muted-foreground border-border"}`}>{s}</span>;
}

function Btn({ children, variant = "primary", sm, lg, className = "", onClick, disabled, type = "button" }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  sm?: boolean; lg?: boolean; className?: string; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  const sz = lg ? "px-6 py-3 text-base" : sm ? "px-3 py-1.5 text-sm" : "px-5 py-2.5 text-sm";
  const base = `inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${sz}`;
  const v = {
    primary:   "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-border",
    outline:   "border border-border hover:bg-secondary text-foreground",
    ghost:     "hover:bg-secondary text-foreground",
    danger:    "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30",
  }[variant];
  return <button type={type} className={`${base} ${v} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on} aria-label={label}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring ${on ? "bg-primary" : "bg-border"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "right-0.5" : "left-0.5"}`}/>
    </button>
  );
}

function EmptyState({ icon: Icon, title, desc, action, onAction, sm }: { icon: any; title: string; desc: string; action?: string; onAction?: () => void; sm?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-4 ${sm ? "py-10" : "py-20"}`}>
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center"><Icon size={26} className="text-muted-foreground"/></div>
      <div><h3 className="font-medium text-base text-foreground font-display">{title}</h3><p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{desc}</p></div>
      {action && onAction && <Btn variant="outline" sm onClick={onAction}>{action}</Btn>}
    </div>
  );
}

function RankMovement({ now, prev }: { now: number; prev: number }) {
  const diff = prev - now;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold"><ChevronUp size={12} strokeWidth={2.5}/>+{diff}</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-destructive text-[11px] font-bold"><ChevronDown size={12} strokeWidth={2.5}/>{diff}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-[11px]"><Minus size={10}/>—</span>;
}

// ── Decorations ───────────────────────────────────────────────────────────────

function TopoDecor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 320" className={`absolute pointer-events-none select-none ${className}`} fill="none" stroke="currentColor" strokeWidth="1.2">
      <ellipse cx="300" cy="160" rx="240" ry="130" opacity=".08"/>
      <ellipse cx="300" cy="160" rx="190" ry="100" opacity=".07"/>
      <ellipse cx="300" cy="160" rx="140" ry="72" opacity=".07"/>
      <ellipse cx="300" cy="160" rx="90"  ry="46" opacity=".07"/>
      <ellipse cx="300" cy="160" rx="44"  ry="24" opacity=".06"/>
    </svg>
  );
}

function MapPlaceholder({ height = "h-64", markers, onClick, clickable }: { height?: string; markers?: Array<{ label: string; x: number; y: number; active?: boolean }>; onClick?: () => void; clickable?: boolean }) {
  return (
    <div className={`relative ${height} rounded-[20px] overflow-hidden bg-[#e8f3e4] dark:bg-[#1B2C24] border border-border ${clickable ? "cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" : ""}`} onClick={onClick} role={clickable ? "button" : undefined} aria-label={clickable ? "Open map view" : undefined}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" fill="none">
        <rect width="800" height="400" fill="currentColor" className="text-[#e8f3e4] dark:text-[#1B2C24]"/>
        <path d="M0 200 Q200 180,400 200 Q600 220,800 200" stroke="#c8dfc4" strokeWidth="6" className="dark:stroke-[#365144]"/>
        <path d="M400 0 Q380 200,400 400" stroke="#c8dfc4" strokeWidth="4" className="dark:stroke-[#365144]"/>
        <path d="M100 100 Q300 120,500 80 Q650 60,800 100" stroke="#d5e8d0" strokeWidth="3" className="dark:stroke-[#2a4234]"/>
        <path d="M0 300 Q250 320,500 300 Q700 280,800 310" stroke="#d5e8d0" strokeWidth="3" className="dark:stroke-[#2a4234]"/>
        <ellipse cx="650" cy="80" rx="120" ry="60" fill="#b8d4e8" opacity=".4" className="dark:opacity-20"/>
        <text x="400" y="380" textAnchor="middle" fontSize="11" fill="#9DB5A4" fontFamily="Manrope, system-ui, sans-serif" opacity="0.8">Auckland region · Illustrative only</text>
      </svg>
      {markers?.map((m, i) => (
        <div key={i} className="absolute flex flex-col items-center" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%,-100%)" }}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform ${m.active ? "bg-primary scale-110" : "bg-primary/80"}`}>
            <MapPin size={13} className="text-white" strokeWidth={2.5}/>
          </div>
          <span className="mt-0.5 text-[10px] font-bold text-foreground bg-card/95 px-1.5 py-0.5 rounded-full shadow whitespace-nowrap">{m.label}</span>
        </div>
      ))}
      {clickable && (
        <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-[10px] px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground shadow-sm">
          <Map size={12} className="text-primary" strokeWidth={2.5}/>Open map
        </div>
      )}
    </div>
  );
}

// ── Mission Card ──────────────────────────────────────────────────────────────

function MissionCard({ q, onView, compact }: { q: Quest; onView: (id: number) => void; compact?: boolean }) {
  const spotsLow = q.spotsLeft !== undefined && q.spotsLeft <= 5;
  return (
    <div className="bg-card border border-border rounded-[20px] overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full" onClick={() => onView(q.id)}>
      <div className="relative">
        <QuestImage imageId={q.imageId} alt={`${q.title} — ${q.category}`} className={compact ? "h-32" : "h-44"}/>
        <div className="absolute bottom-0 left-0 translate-y-1/2 ml-3">
          <div className="shadow-lg rounded-[12px] overflow-hidden border-2 border-card">
            <CategoryEmblem category={q.category} size={40}/>
          </div>
        </div>
        <div className="absolute top-2.5 right-2.5"><XPPill xp={q.xp} sm/></div>
        {q.tags && q.tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            {q.tags.map(t => <TagChip key={t} tag={t}/>)}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2.5 p-4 pt-6">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${CAT_CFG[q.category]?.color || "text-muted-foreground"}`}>{q.category}</p>
          <h3 className="font-medium text-[15px] text-card-foreground leading-snug group-hover:text-primary transition-colors font-display mt-0.5">{q.title}</h3>
          <p className="text-xs text-muted-foreground">{q.organizer}</p>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar size={11} strokeWidth={2.5} className="shrink-0"/><span>{q.date}</span></div>
          <div className="flex items-center gap-1.5"><MapPin size={11} strokeWidth={2.5} className="shrink-0"/><span>{q.community ? `${q.community}, ` : ""}{q.location}</span></div>
          {q.capacity && <div className="flex items-center gap-1.5"><Users size={11} strokeWidth={2.5} className="shrink-0"/><span className={spotsLow ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>{q.spotsLeft} of {q.capacity} spots left</span></div>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <DiffBadge d={q.difficulty}/>
          <VerifyBadge v={q.verification}/>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <SourceChip source={q.source}/>
          <span className="text-xs font-semibold text-primary flex items-center gap-0.5 shrink-0">View<ChevronRight size={13}/></span>
        </div>
      </div>
    </div>
  );
}

// ── Navigation ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { p: "discover"    as Page, Icon: Compass, label: "Discover" },
  { p: "my-quests"  as Page, Icon: Target,   label: "My Quests" },
  { p: "passport"   as Page, Icon: Award,    label: "Passport" },
  { p: "leaderboard"as Page, Icon: Trophy,   label: "Leaderboard" },
];

function Nav({ page, setPage, dark, setDark, isLoggedIn, setLoggedIn }: {
  page: Page; setPage: (p: Page) => void; dark: boolean; setDark: (d: boolean) => void;
  isLoggedIn: boolean; setLoggedIn: (v: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <button onClick={() => { setPage("landing"); window.scrollTo(0,0); }} className="flex items-center gap-2 shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm"><Leaf size={14} className="text-primary-foreground" strokeWidth={2.5}/></div>
          <span className="font-medium text-[15px] text-foreground font-display hidden sm:block">Kiwimpact</span>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {isLoggedIn ? NAV_ITEMS.map(({ p, Icon, label }) => (
            <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${page === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Icon size={15} strokeWidth={page === p ? 2.5 : 2}/>{label}
            </button>
          )) : (
            <>
              <button onClick={() => { setPage("discover"); window.scrollTo(0,0); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${page==="discover"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><Compass size={15} strokeWidth={2}/>Discover</button>
              <button onClick={() => { setPage("leaderboard"); window.scrollTo(0,0); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${page==="leaderboard"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><Trophy size={15} strokeWidth={2}/>Leaderboard</button>
              <a href="#how-it-works" className="px-3.5 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">How it works</a>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {isLoggedIn && <PlayerStatusCapsule compact onClick={() => setPage("passport")}/>}
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          {isLoggedIn ? (
            <button onClick={() => setLoggedIn(false)} className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-primary/20 font-bold text-xs text-primary hover:bg-primary/30 transition-colors font-display">MK</button>
          ) : (
            <>
              <Btn variant="ghost" sm onClick={() => setLoggedIn(true)}>Sign in</Btn>
              <Btn sm onClick={() => setLoggedIn(true)} className="hidden sm:inline-flex">Join free</Btn>
            </>
          )}
          <button className="md:hidden w-9 h-9 flex items-center justify-center text-muted-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {(isLoggedIn ? NAV_ITEMS : [{ p:"discover" as Page, Icon:Compass, label:"Discover" },{ p:"leaderboard" as Page, Icon:Trophy, label:"Leaderboard" }]).map(({ p, Icon, label }) => (
            <button key={p} onClick={() => { setPage(p); setMenuOpen(false); window.scrollTo(0,0); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] text-sm font-semibold text-left transition-colors min-h-[44px] ${page===p?"bg-primary/10 text-primary":"text-foreground hover:bg-secondary"}`}>
              <Icon size={16} strokeWidth={2}/>{label}
            </button>
          ))}
          {!isLoggedIn && <Btn onClick={() => { setLoggedIn(true); setMenuOpen(false); }} className="mt-2">Join Kiwimpact</Btn>}
        </div>
      )}
    </header>
  );
}

function BottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {NAV_ITEMS.map(({ p, Icon, label }) => (
        <button key={p} onClick={() => { setPage(p); window.scrollTo(0,0); }} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors min-h-[44px] ${page===p?"text-primary":"text-muted-foreground"}`}>
          <Icon size={20} strokeWidth={page===p?2.5:1.8}/>{label}
        </button>
      ))}
    </nav>
  );
}

// ── Filter Drawer ─────────────────────────────────────────────────────────────

interface Filters { categories: string[]; difficulties: string[]; sources: string[]; verifications: string[]; availability: string; showMyCommunity: boolean; }
const DEFAULT_FILTERS: Filters = { categories: [], difficulties: [], sources: [], verifications: [], availability: "all", showMyCommunity: false };

function FilterDrawer({ open, onClose, filters, onChange, hasHomeCommunity, homeCommunity }: {
  open: boolean; onClose: () => void; filters: Filters; onChange: (f: Filters) => void;
  hasHomeCommunity: boolean; homeCommunity: string;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  useEffect(() => { if (open) setLocal(filters); }, [open, filters]);
  const toggle = <T extends string>(arr: T[], val: T): T[] => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  const Chip = ({ val, active, onClick }: { val: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors min-h-[36px] ${active?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary text-foreground"}`}>{val}</button>
  );
  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2.5"><h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4><div className="flex flex-wrap gap-2">{children}</div></div>
  );
  const count = local.categories.length + local.difficulties.length + local.sources.length + local.verifications.length + (local.availability!=="all"?1:0) + (local.showMyCommunity?1:0);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-card w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg text-foreground font-display">Filter quests</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"><X size={16}/></button>
        </div>
        {hasHomeCommunity && <Sec title="Location"><Chip val={`In ${homeCommunity}`} active={local.showMyCommunity} onClick={() => setLocal({...local, showMyCommunity:!local.showMyCommunity})}/></Sec>}
        <Sec title="Category">{CATS.map(c => <Chip key={c} val={c} active={local.categories.includes(c)} onClick={() => setLocal({...local, categories:toggle(local.categories,c)})}/>)}</Sec>
        <Sec title="Difficulty">{["Easy","Medium","Hard"].map(d => <Chip key={d} val={d} active={local.difficulties.includes(d)} onClick={() => setLocal({...local, difficulties:toggle(local.difficulties,d)})}/>)}</Sec>
        <Sec title="Source">{["Official external event","Organizer quest","Kiwimpact challenge"].map(s => <Chip key={s} val={s} active={local.sources.includes(s)} onClick={() => setLocal({...local, sources:toggle(local.sources,s)})}/>)}</Sec>
        <Sec title="Verification">{["Completion code","Evidence reviewed","Self reported · No XP"].map(v => <Chip key={v} val={v} active={local.verifications.includes(v)} onClick={() => setLocal({...local, verifications:toggle(local.verifications,v)})}/>)}</Sec>
        <Sec title="Availability">{["all","with-spots","anytime"].map(a => <Chip key={a} val={a==="all"?"Any":a==="with-spots"?"Spots available":"Any time"} active={local.availability===a} onClick={() => setLocal({...local,availability:a})}/>)}</Sec>
        <div className="flex gap-3 pt-2 border-t border-border">
          <Btn variant="outline" className="flex-1" onClick={() => setLocal(DEFAULT_FILTERS)}>Clear all</Btn>
          <Btn className="flex-1" onClick={() => { onChange(local); onClose(); }}>Show results{count>0?` (${count})`:""}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Community Selector ────────────────────────────────────────────────────────

function CommunitySelector({ onSave, onClose }: { onSave: (c: string) => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState("Henderson-Massey");
  const COMMUNITIES = ["Henderson-Massey","Albert-Eden","Māngere-Ōtāhuhu","Howick","Kaipātiki","Manurewa","Papakura","Waitematā"];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => { onSave(selected); onClose(); }, 900); }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-card w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"><X size={16}/></button>
        <h3 className="font-medium text-xl text-foreground font-display mb-1">Profile Settings — Community</h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Your Home Community is used for local leaderboards and community progress. We do not collect or display your precise home address. You can change this once every 30 days.</p>
        <div className="space-y-3 mb-5">
          {[{label:"Country",val:"New Zealand"},{label:"City / Region",val:"Auckland"}].map(({label,val}) => (
            <div key={label}><label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
              <div className="px-3 py-2.5 rounded-[12px] border border-border bg-secondary text-sm text-foreground font-semibold flex items-center justify-between">{val}<Globe size={14} className="text-muted-foreground"/></div>
            </div>
          ))}
          <div><label className="block text-xs font-bold text-foreground mb-1.5">Community <span className="text-destructive">*</span></label>
            <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full px-3 py-2.5 rounded-[12px] border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-secondary border border-border rounded-[12px] p-3 text-xs text-muted-foreground mb-4 flex items-start gap-2">
          <Info size={12} className="shrink-0 mt-0.5 text-muted-foreground" strokeWidth={2.5}/>
          <span>Viewing a leaderboard scope does not change your Home Community. Only this setting does.</span>
        </div>
        {saved && <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-[12px] px-3 py-2 mb-4"><CheckCircle2 size={15} strokeWidth={2.5}/>Saved — {selected}</div>}
        <Btn className="w-full" onClick={handleSave} disabled={saving||saved}>
          {saving?<><RefreshCw size={15} className="animate-spin"/>Saving…</>:saved?<><Check size={15}/>Saved</>:"Save community"}
        </Btn>
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage({ setPage, isLoggedIn, setLoggedIn, hasJoinedQuests }: {
  setPage: (p: Page) => void; isLoggedIn: boolean; setLoggedIn: (v: boolean) => void; hasJoinedQuests: boolean;
}) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const featuredQuests = QUESTS.slice(0, 3);
  const nextQuest = QUESTS.find(q => !q.memberStatus) || QUESTS[3];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero — text left, map right */}
      <section className="relative overflow-hidden bg-background pt-10 pb-12 px-4">
        <TopoDecor className="w-[700px] h-auto -top-8 -right-24 text-primary"/>
        <div className="max-w-[1200px] mx-auto relative">
          <div className="grid md:grid-cols-2 gap-10 items-start mb-8">
            <div className="space-y-5 relative z-10">
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full uppercase">
                <MapPin size={11} strokeWidth={2.5}/>Auckland-first eco adventures
              </span>
              {isLoggedIn && hasJoinedQuests ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-medium text-foreground leading-[1.1] font-display">Keep going,<br/><span className="text-primary">Mia.</span></h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">You have an active quest. Complete it to earn XP and help your community.</p>
                  <div className="flex flex-wrap gap-3">
                    <Btn lg onClick={() => setPage("my-quests")}>View My Quests<ArrowRight size={18}/></Btn>
                    <Btn lg variant="outline" onClick={() => setPage("discover")}>Discover more</Btn>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-medium text-foreground leading-[1.1] font-display">Turn local action into<br/><span className="text-primary">lasting progress.</span></h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">Discover eco quests near you, get verified, earn XP, and build your Impact Passport — together.</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    {["Discover","Join","Verify","Earn XP","Grow Passport","Help community"].map((step, i, arr) => (
                      <span key={step} className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${i < 2 ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>{step}</span>
                        {i < arr.length - 1 && <ArrowRight size={12} className="text-muted-foreground/50"/>}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Btn lg onClick={() => setPage("discover")}>Explore quests<ArrowRight size={18}/></Btn>
                    {!isLoggedIn && <Btn lg variant="outline" onClick={() => setLoggedIn(true)}>Join free</Btn>}
                  </div>
                </>
              )}
            </div>
            {/* Map — clicking opens Discover in map mode */}
            <div className="relative z-10">
              <MapPlaceholder
                height="h-72"
                clickable
                onClick={() => setPage("discover")}
                markers={QUESTS.filter(q => q.community).map((q, i) => ({
                  label: q.community!,
                  x: 20 + i * 14,
                  y: 28 + i * 9,
                  active: i === 0,
                }))}
              />
              <div className="absolute -bottom-3 -left-2 bg-card border border-border rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500"/><span className="text-xs font-bold text-foreground">3-week streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Progress + Community Challenge — two clearly distinct blocks */}
      <section className="bg-secondary/40 py-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Block 1: Personal Progress */}
            <div className="bg-card border border-border rounded-[24px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Your Next Steps</p>
                  <h2 className="text-lg font-medium text-foreground font-display">Personal Progress</h2>
                </div>
                <Btn variant="outline" sm onClick={() => setPage("my-quests")}>My Quests<ChevronRight size={13}/></Btn>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quest path</p>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <div className="bg-primary/5 border border-primary/20 rounded-[14px] p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider"><CheckCircle2 size={10} strokeWidth={2.5}/>Active</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0"><QuestImage imageId="quest1" alt="Current quest"/></div>
                      <p className="text-xs font-semibold text-foreground leading-snug font-display">Restore the Harbour Edge</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={14} className="text-muted-foreground"/>
                    <span className="text-[9px] text-muted-foreground font-semibold">then</span>
                  </div>
                  <div className="bg-secondary border border-border rounded-[14px] p-3 space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Up next</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[8px] overflow-hidden shrink-0"><QuestImage imageId={nextQuest.imageId} alt="Next quest"/></div>
                      <p className="text-xs font-semibold text-foreground leading-snug font-display">{nextQuest.title}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement path</p>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-[14px] p-3 flex items-center gap-2">
                    <AchievementBadgeSVG achievement={ACHIEVEMENTS[1]} size={28}/>
                    <div><p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Earned</p><p className="text-xs font-semibold text-foreground font-display">Local Helper</p></div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground"/>
                  <div className="bg-secondary border border-border rounded-[14px] p-3 flex items-center gap-2">
                    <AchievementBadgeSVG achievement={ACHIEVEMENTS[2]} size={28}/>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">2/3</p><p className="text-xs font-semibold text-foreground font-display">Nature Restorer</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Community Challenge — separate */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Community Goal</p>
                  <h2 className="text-lg font-medium text-foreground font-display">Henderson-Massey Challenge</h2>
                </div>
              </div>
              <CommunityChallenge onViewDetails={() => setShowChallengeDetail(true)}/>
            </div>
          </div>
        </div>
      </section>

      {/* Featured quests */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div><h2 className="text-2xl font-medium text-foreground font-display">Featured quests</h2><p className="text-muted-foreground mt-1">Active opportunities around Auckland.</p></div>
            <Btn variant="outline" sm onClick={() => setPage("discover")} className="hidden sm:inline-flex">View all<ChevronRight size={14}/></Btn>
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredQuests.map(q => <MissionCard key={q.id} q={q} onView={() => setPage("quest-detail")}/>)}
          </div>
          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
              {featuredQuests.map((q) => (
                <div key={q.id} className="snap-center shrink-0 w-[85vw] max-w-[320px]">
                  <MissionCard q={q} onView={() => setPage("quest-detail")}/>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {featuredQuests.map((_,i) => <button key={i} onClick={() => setCarouselIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i===carouselIdx?"bg-primary w-4":"bg-border"}`}/>)}
            </div>
          </div>
          <div className="flex justify-center mt-6 sm:hidden"><Btn variant="outline" sm onClick={() => setPage("discover")}>View all quests<ChevronRight size={14}/></Btn></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-secondary/40">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12"><h2 className="text-2xl font-medium text-foreground font-display">One connected loop</h2><p className="text-muted-foreground mt-2">Every step builds on the last.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { cat: "Restore Nature",       n:"01", title:"Discover a Quest",     desc:"Browse by category, location, and difficulty. Find something meaningful near you." },
              { cat: "Observe & Measure",    n:"02", title:"Join and complete it",  desc:"Attend, participate, then enter your completion code or submit evidence." },
              { cat: "Protect Wildlife",     n:"03", title:"Get verified",          desc:"Verified completions earn XP, streak credit, and leaderboard position." },
              { cat: "Learn & Share",        n:"04", title:"Earn XP and advance",   desc:"Level up, unlock achievement badges, and track your rank title progression." },
              { cat: "Grow & Compost",       n:"05", title:"Help your community",   desc:"Every verified quest counts toward the Henderson-Massey community monthly goal." },
              { cat: "Clean & Reduce Waste", n:"06", title:"Grow your Passport",    desc:"Your Personal Impact Passport records everything — share your achievements." },
            ].map(({ cat, n, title, desc }) => (
              <div key={n} className="relative bg-card border border-border rounded-[20px] p-6 hover:border-primary/30 transition-colors">
                <div className="mb-4"><CategoryEmblem category={cat} size={36}/></div>
                <span className="absolute top-4 right-5 text-3xl font-medium text-border select-none font-display">{n}</span>
                <h3 className="font-medium text-base text-foreground mb-1.5 font-display">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievement band */}
      <section className="bg-primary text-primary-foreground py-20 px-4 relative overflow-hidden">
        <TopoDecor className="w-[600px] h-auto -top-8 -left-12 text-primary-foreground"/>
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-5">
            <h2 className="text-2xl font-medium font-display">Build your Impact Passport</h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">Every verified quest adds to your Passport — a personal record that's yours to keep and share.</p>
            <div className="grid grid-cols-2 gap-4">
              {[{Icon:TrendingUp,val:"Lv 1–39",label:"40 levels"},{Icon:Star,val:"4 Rank titles",label:"Novice to Ranger"},{Icon:Award,val:"8 to earn",label:"Achievement badges"},{Icon:Flame,val:"Weekly",label:"Streak tracking"}].map(({Icon,val,label}) => (
                <div key={label} className="bg-primary-foreground/10 rounded-[16px] p-4 flex items-center gap-3 border border-primary-foreground/10"><Icon size={18} className="shrink-0 opacity-80" strokeWidth={2.5}/><div><p className="font-bold text-sm font-display">{val}</p><p className="text-xs opacity-70">{label}</p></div></div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {ACHIEVEMENTS.slice(0,5).map(a => (
              <div key={a.id} className="bg-primary-foreground/10 rounded-[16px] p-3.5 flex items-center gap-3.5 border border-primary-foreground/10">
                <AchievementBadgeSVG achievement={a} size={40}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-sm font-display">{a.name}</p>
                    {a.earned ? <CheckCircle2 size={14} className="text-accent shrink-0" strokeWidth={2.5}/> : <span className="text-xs opacity-60 shrink-0">{a.progress}/{a.total}</span>}
                  </div>
                  {!a.earned && <PBar val={a.progress} max={a.total} h="h-1" cls="max-w-[160px]"/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-20 px-4 bg-secondary/40">
          <div className="max-w-xl mx-auto text-center space-y-5">
            <h2 className="text-2xl font-medium text-foreground font-display">Ready to make an impact?</h2>
            <p className="text-muted-foreground">Join Kiwimpact — Auckland's growing community of eco quest participants.</p>
            <div className="flex flex-wrap gap-3 justify-center"><Btn lg onClick={() => setPage("discover")}>Explore quests<ArrowRight size={16}/></Btn><Btn lg variant="outline" onClick={() => setLoggedIn(true)}>Create free account</Btn></div>
          </div>
        </section>
      )}

      <footer className="bg-foreground text-background py-10 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center"><Leaf size={11} className="text-white" strokeWidth={2.5}/></div><span className="font-medium text-sm font-display">Kiwimpact</span><span className="text-xs opacity-40 ml-1">· Community eco quests across New Zealand</span></div>
          <p className="text-xs opacity-30">© 2026 Kiwimpact. Auckland-first.</p>
        </div>
      </footer>

      {showChallengeDetail && <ChallengeDetailModal onClose={() => setShowChallengeDetail(false)}/>}
    </div>
  );
}

// ── Discover Page ─────────────────────────────────────────────────────────────

function DiscoverPage({ setPage, setSelectedQuest, isLoggedIn, hasHomeCommunity, homeCommunity, onSetupCommunity }: {
  setPage: (p: Page) => void; setSelectedQuest: (id: number) => void;
  isLoggedIn: boolean; hasHomeCommunity: boolean; homeCommunity: string; onSetupCommunity: () => void;
}) {
  const [view, setView] = useState<"cards"|"map">("cards");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("soonest");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeMarker, setActiveMarker] = useState<number|null>(null);

  const activeCount = filters.categories.length + filters.difficulties.length + filters.sources.length + filters.verifications.length + (filters.availability!=="all"?1:0) + (filters.showMyCommunity?1:0);

  const filtered = QUESTS.filter(q => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.categories.length && !filters.categories.includes(q.category)) return false;
    if (filters.difficulties.length && !filters.difficulties.includes(q.difficulty)) return false;
    if (filters.sources.length && !filters.sources.includes(q.source)) return false;
    if (filters.verifications.length && !filters.verifications.includes(q.verification)) return false;
    if (filters.availability==="with-spots" && (!q.capacity||q.spotsLeft===0)) return false;
    if (filters.availability==="anytime" && q.date!=="Any time") return false;
    if (filters.showMyCommunity && q.community !== homeCommunity) return false;
    return true;
  });

  const onView = (id: number) => { setSelectedQuest(id); setPage("quest-detail"); };

  return (
    <div className="min-h-screen py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground font-display">Discover eco quests</h1>
          {hasHomeCommunity
            ? <p className="text-muted-foreground mt-1">Quests in <span className="font-semibold text-foreground">{homeCommunity}</span> and across Auckland.</p>
            : <p className="text-muted-foreground mt-1">Find practical ways to help around Auckland.</p>}
        </div>

        {isLoggedIn && !hasHomeCommunity && (
          <div className="bg-primary/5 border border-primary/20 rounded-[16px] px-4 py-3.5 flex items-center gap-3 mb-5">
            <MapPin size={16} className="text-primary shrink-0" strokeWidth={2.5}/>
            <div className="flex-1"><p className="text-sm font-semibold text-foreground">Set your community</p><p className="text-xs text-muted-foreground">Filter quests nearby and join your local leaderboard.</p></div>
            <Btn sm onClick={onSetupCommunity}>Set community</Btn>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2.5}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quests or location…" className="w-full pl-9 pr-4 py-2.5 rounded-[14px] bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"/>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-semibold border transition-colors ${activeCount>0?"bg-primary/10 border-primary/30 text-primary":"border-border hover:bg-secondary text-foreground"}`}>
              <SlidersHorizontal size={15} strokeWidth={2.5}/>Filters{activeCount>0&&<span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{activeCount}</span>}
            </button>
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2.5 rounded-[14px] bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground">
              <option value="soonest">Soonest</option><option value="recommended">Recommended</option><option value="xp">Most XP</option>
            </select>
            <div className="flex border border-border rounded-[14px] overflow-hidden bg-card">
              <button onClick={() => setView("cards")} className={`px-3 py-2.5 transition-colors min-h-[44px] ${view==="cards"?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-secondary"}`}><LayoutGrid size={16}/></button>
              <button onClick={() => setView("map")} className={`px-3 py-2.5 transition-colors min-h-[44px] ${view==="map"?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-secondary"}`}><Map size={16}/></button>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setFilters({...filters,categories:[],showMyCommunity:false})} className={`px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 transition-colors ${!filters.categories.length&&!filters.showMyCommunity?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary text-foreground"}`}>All</button>
          {hasHomeCommunity && (
            <button onClick={() => setFilters({...filters,showMyCommunity:!filters.showMyCommunity})} className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1 shrink-0 transition-colors ${filters.showMyCommunity?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary text-foreground"}`}>
              <Home size={11} strokeWidth={2.5}/>In {homeCommunity}
            </button>
          )}
          {CATS.map(cat => {
            const c = CAT_CFG[cat]; const active = filters.categories.includes(cat);
            return (
              <button key={cat} onClick={() => setFilters({...filters,categories:filters.categories.includes(cat)?filters.categories.filter(x=>x!==cat):[...filters.categories,cat]})}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-colors ${active?`${c.bg} ${c.color} ${c.border}`:"border-border hover:bg-secondary text-foreground"}`}>
                <CategoryEmblem category={cat} size={14}/>
                {cat}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground mb-5">{filtered.length} quest{filtered.length!==1?"s":""} found{filters.showMyCommunity?` in ${homeCommunity}`:""}</p>

        {view==="cards" ? (
          filtered.length>0
            ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(q=><MissionCard key={q.id} q={q} onView={onView}/>)}</div>
            : <EmptyState icon={Compass} title="No quests match" desc="Try removing a filter." action="Clear filters" onAction={()=>{setSearch("");setFilters(DEFAULT_FILTERS);}}/>
        ) : (
          // Vertical layout: map full-width on top, quest list below
          <div className="space-y-5">
            <MapPlaceholder height="h-[380px]" markers={QUESTS.map((q,i)=>({label:q.community||q.location,x:20+i*13,y:30+i*10,active:activeMarker===q.id}))}/>
            <div className="space-y-2.5">
              {filtered.map(q=>(
                <div key={q.id} className={`bg-card border rounded-[16px] p-4 flex gap-3 cursor-pointer transition-colors ${activeMarker===q.id?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`} onClick={()=>setActiveMarker(q.id===activeMarker?null:q.id)}>
                  <div className="w-16 h-16 rounded-[12px] overflow-hidden shrink-0"><QuestImage imageId={q.imageId} alt={q.title} className="w-full h-full"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div><CategoryBadge category={q.category} sm/><p className="font-medium text-sm mt-1 text-foreground font-display">{q.title}</p><div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground"><MapPin size={11} strokeWidth={2.5}/>{q.community?`${q.community}, `:""}{q.location}</div></div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0"><XPPill xp={q.xp} sm/><Btn sm variant="outline" onClick={()=>onView(q.id)}>Details</Btn></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <FilterDrawer open={filterOpen} onClose={()=>setFilterOpen(false)} filters={filters} onChange={setFilters} hasHomeCommunity={hasHomeCommunity} homeCommunity={homeCommunity}/>
    </div>
  );
}

// ── Quest Detail Page ─────────────────────────────────────────────────────────

function QuestDetailPage({ questId, setPage, isLoggedIn, setLoggedIn, onOpenCompletion, setSelectedQuestId }: {
  questId: number; setPage: (p: Page) => void; isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void; onOpenCompletion: () => void; setSelectedQuestId: (id: number) => void;
}) {
  const q = QUESTS.find(x => x.id === questId) || QUESTS[0];
  const [joined, setJoined] = useState(q.memberStatus === "joined");

  return (
    <div className="min-h-screen pb-28 md:pb-8">
      {/* Large hero */}
      <div className="relative h-64 md:h-[420px] w-full overflow-hidden">
        <QuestImage imageId={q.imageId} alt={`${q.title} — ${q.category} quest hero image`} className="w-full h-full" overlay="bg-gradient-to-t from-background/80 via-transparent to-transparent"/>
        <div className="absolute bottom-4 left-6 flex items-center gap-3">
          <CategoryEmblem category={q.category} size={52}/>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${CAT_CFG[q.category]?.color || "text-foreground"}`}>{q.category}</p>
            {q.community && <p className="text-sm font-semibold text-foreground">{q.community}</p>}
          </div>
        </div>
        <button onClick={() => setPage("discover")} className="absolute top-4 left-4 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-foreground text-sm font-semibold px-3 py-2 rounded-full hover:bg-card transition-colors">
          <ChevronLeft size={15}/>Discover
        </button>
        <p className="absolute bottom-2 right-3 text-[9px] text-white/50">Image: Unsplash · Prototype only</p>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">{joined&&<StatusChip s="Joined"/>}<SourceChip source={q.source}/></div>
              <h1 className="text-3xl md:text-4xl font-medium text-foreground leading-tight font-display">{q.title}</h1>
              <p className="text-muted-foreground">by <span className="font-semibold text-foreground">{q.organizer}</span></p>
              <div className="flex flex-wrap gap-2 md:hidden"><XPPill xp={q.xp}/><DiffBadge d={q.difficulty}/><VerifyBadge v={q.verification}/></div>
            </div>

            {/* Logistics */}
            <div className="bg-card border border-border rounded-[20px] p-6 grid sm:grid-cols-2 gap-4">
              {[
                {Icon:Calendar,label:"Date & time",val:q.date},
                {Icon:MapPin,label:"General location",val:q.community?`${q.community}, ${q.location}`:q.location},
                {Icon:Clock,label:"Duration",val:q.duration},
                {Icon:Users,label:"Eligibility",val:q.eligibility},
                ...(q.capacity?[{Icon:Layers,label:"Capacity",val:`${q.spotsLeft} spots remaining`}]:[]),
              ].map(({Icon,label,val})=>(
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Icon size={15} className="text-primary" strokeWidth={2.5}/></div>
                  <div><p className="text-xs text-muted-foreground font-semibold mb-0.5">{label}</p><p className="text-sm font-semibold text-foreground">{val}</p></div>
                </div>
              ))}
            </div>

            {/* Reward panel */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-amber-800 dark:text-amber-200 font-display flex items-center gap-2"><Zap size={16} strokeWidth={2.5}/>Rewards for completing</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3"><XPPill xp={q.xp}/><span className="text-sm text-amber-800 dark:text-amber-200 font-semibold">Verified XP</span></div>
                <div className="flex items-center gap-3"><AchievementBadgeSVG achievement={ACHIEVEMENTS[2]} size={28}/><span className="text-sm text-amber-800 dark:text-amber-200">Progress toward <strong>Nature Restorer</strong> badge (2/3)</span></div>
                <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><Users size={13} className="text-primary" strokeWidth={2.5}/></div><span className="text-sm text-amber-800 dark:text-amber-200">Counts toward <strong>Henderson-Massey</strong> July Challenge (42/50)</span></div>
              </div>
            </div>

            {/* Quest briefing */}
            <div className="bg-card border border-border rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-foreground font-display">Quest Briefing</h3>
              {[{n:1,label:"Join this quest",desc:"Add it to your Mission Board."},{n:2,label:"Attend",desc:q.date==="Any time"?"Complete at any time that suits you.":"Show up on the day."},{n:3,label:"Verify your completion",desc:q.verification==="Completion code"?"Enter the 6-char code from the organiser.":q.verification==="Evidence reviewed"?"Submit a description and optional evidence link.":"Record it as self-reported (no XP)."},{n:4,label:"Earn your reward",desc:`+${q.xp} XP${q.verification==="Self reported · No XP"?" (Passport record only — no XP)":""}`}].map(({n,label,desc})=>(
                <div key={n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground">{n}</div>
                  <div><p className="text-sm font-semibold text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                </div>
              ))}
            </div>

            <div><h2 className="font-medium text-lg text-foreground mb-2 font-display">About this quest</h2><p className="text-muted-foreground leading-relaxed">{q.description}</p></div>
            <div><h2 className="font-medium text-lg text-foreground mb-2 font-display">What to expect</h2><p className="text-muted-foreground leading-relaxed">{q.whatToExpect}</p></div>

            {/* Image gallery — below briefing, inside content */}
            <QuestDetailGallery questId={q.id}/>

            <div className="bg-card border border-border rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-foreground flex items-center gap-2 font-display"><Shield size={16} className="text-primary" strokeWidth={2.5}/>Verification &amp; XP</h3>
              <div className="flex flex-wrap gap-2"><VerifyBadge v={q.verification}/><XPPill xp={q.xp}/></div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {q.verification==="Completion code"&&"The organiser will share a short code at the end of the event. Enter it in the app to confirm attendance and earn XP."}
                {q.verification==="Evidence reviewed"&&"After completing the quest, submit a brief description and optional evidence link. Our team will review within a few days."}
                {q.verification==="Self reported · No XP"&&"This quest uses self-reporting. Completions appear in your Passport but earn no XP, streak credit, or leaderboard position."}
              </p>
              {q.verification==="Self reported · No XP"&&<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-[12px] px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex gap-2"><Info size={13} className="shrink-0 mt-0.5" strokeWidth={2.5}/>Only verified completions earn XP, streak, achievements, and leaderboard position.</div>}
            </div>

            <div><h2 className="font-medium text-lg text-foreground mb-3 font-display">General location</h2><MapPlaceholder height="h-52" markers={[{label:q.community||q.location,x:50,y:48}]}/><p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Info size={11} strokeWidth={2.5}/>General area only. Full address provided after joining.</p></div>

            <div>
              <h2 className="font-medium text-xl text-foreground mb-5 font-display">Related quests</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUESTS.filter(x=>x.id!==q.id).slice(0,3).map(rq=><MissionCard key={rq.id} q={rq} onView={(id)=>{setSelectedQuestId(id);}} compact/>)}
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 bg-card border border-border rounded-[24px] p-6 space-y-5 shadow-sm">
              <div className="space-y-3">
                {[{label:"XP Reward",el:<XPPill xp={q.xp}/>},{label:"Difficulty",el:<DiffBadge d={q.difficulty}/>},{label:"Verification",el:<VerifyBadge v={q.verification}/>},...(q.spotsLeft?[{label:"Availability",el:<span className={`text-sm font-semibold ${q.spotsLeft<=5?"text-amber-600":"text-foreground"}`}>{q.spotsLeft} spots left</span>}]:[])].map(({label,el})=>(
                  <div key={label} className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{label}</span>{el}</div>
                ))}
              </div>
              <div className="border-t border-border pt-5 space-y-3">
                {!isLoggedIn
                  ? <><Btn className="w-full" onClick={()=>setLoggedIn(true)}><LogIn size={15}/>Sign in to join</Btn><p className="text-xs text-center text-muted-foreground">Free account required.</p></>
                  : joined
                    ? <><div className="flex items-center gap-2 text-primary font-semibold text-sm"><CheckCircle2 size={16} strokeWidth={2.5}/>Joined</div><Btn className="w-full" onClick={onOpenCompletion}>Complete quest</Btn><button onClick={()=>setJoined(false)} className="w-full text-xs text-muted-foreground hover:text-destructive text-center transition-colors">Cancel participation</button></>
                    : q.source==="Official external event"
                      ? <><Btn className="w-full"><ExternalLink size={15}/>View official event</Btn><div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground mb-2">Already attended? Submit to earn XP.</p><Btn variant="outline" className="w-full" sm onClick={onOpenCompletion}>Submit completion</Btn></div></>
                      : <Btn className="w-full" onClick={()=>setJoined(true)}>Join quest</Btn>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur border-t border-border p-3 flex items-center gap-3 z-30">
        <div className="flex items-center gap-2"><XPPill xp={q.xp} sm/><DiffBadge d={q.difficulty}/></div>
        <div className="ml-auto">
          {!isLoggedIn?<Btn sm onClick={()=>setLoggedIn(true)}>Sign in</Btn>
          :joined?<Btn sm onClick={onOpenCompletion}>Complete quest</Btn>
          :q.source==="Official external event"?<Btn sm><ExternalLink size={13}/>View event</Btn>
          :<Btn sm onClick={()=>setJoined(true)}>Join quest</Btn>}
        </div>
      </div>
    </div>
  );
}

// ── My Quests / Mission Board ─────────────────────────────────────────────────

function MyQuestsPage({ setPage, onOpenCompletion }: { setPage: (p: Page) => void; onOpenCompletion: () => void }) {
  const [tab, setTab] = useState<QuestTab>("upcoming");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);
  const streakRef = useRef<HTMLButtonElement>(null);

  const tabData: Record<QuestTab, Array<Quest & { chipStatus: string; primaryAction?: string }>> = {
    upcoming:  QUESTS.filter(q=>q.memberStatus==="joined").map(q=>({...q,chipStatus:"Joined",primaryAction:"View details"})),
    awaiting:  QUESTS.filter(q=>q.memberStatus==="awaiting").map(q=>({...q,chipStatus:"Completion available",primaryAction:q.verification==="Completion code"?"Enter completion code":"Submit claim"})),
    review:    [],
    completed: QUESTS.filter(q=>q.memberStatus==="completed").map(q=>({...q,chipStatus:"Verified",primaryAction:"Create share card"})),
  };
  const TABS = [{key:"upcoming"as QuestTab,label:"Active"},{key:"awaiting"as QuestTab,label:"Ready to Complete"},{key:"review"as QuestTab,label:"Under Review"},{key:"completed"as QuestTab,label:"Completed"}];

  return (
    <div className="min-h-screen py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <h1 className="text-3xl font-medium text-foreground font-display">Mission Board</h1>

        {/* Player status card */}
        <div className="bg-card border border-border rounded-[24px] p-6 relative overflow-hidden">
          <TopoDecor className="w-96 h-auto -top-4 -right-12 text-primary"/>
          <div className="relative grid sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-5 items-center">
            <RankCrest rankTitle="Novice" size={56}/>
            <div className="space-y-2">
              <div>
                <h2 className="text-xl font-medium text-foreground font-display">Mia K.</h2>
                <p className="text-sm text-muted-foreground">
                  <button
                    className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                    onClick={() => setShowLevelModal(true)}
                    title="View level and rank details"
                  >Level 7</button> · <span className="font-semibold text-foreground">Novice</span>
                </p>
              </div>
              <div className="max-w-xs space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span className="font-bold text-foreground">420 XP</span><span>525 XP next level</span></div>
                <PBar val={420} max={525} h="h-2.5"/>
              </div>
              <div className="text-xs text-muted-foreground">#1 in Henderson-Massey this week · #18 Auckland</div>
            </div>
            <div className="flex sm:flex-row lg:flex-col gap-3">
              {/* Streak with tooltip */}
              <div className="relative">
                <button
                  ref={streakRef}
                  className="bg-secondary border border-border rounded-[14px] px-4 py-2.5 text-center hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-900/20 dark:hover:border-amber-700 transition-colors"
                  onMouseEnter={() => setShowStreakTooltip(true)}
                  onMouseLeave={() => setShowStreakTooltip(false)}
                  onFocus={() => setShowStreakTooltip(true)}
                  onBlur={() => setShowStreakTooltip(false)}
                  aria-describedby="streak-tooltip"
                >
                  <div className="flex items-center gap-1.5 justify-center"><Flame size={15} className="text-orange-500"/><span className="font-bold text-lg text-foreground font-display">3</span></div>
                  <p className="text-xs text-muted-foreground mt-0.5">Week streak</p>
                </button>
                {showStreakTooltip && (
                  <div id="streak-tooltip" role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-foreground text-background text-xs rounded-[12px] p-3 shadow-xl z-20 space-y-1.5">
                    <p className="font-bold">How to keep your streak</p>
                    <p className="opacity-80">Complete at least 1 verified Quest each week before the week ends (Monday midnight).</p>
                    <ul className="space-y-1 opacity-75">
                      <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="shrink-0 mt-0.5 text-emerald-400"/><span>Completion code quests count</span></li>
                      <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="shrink-0 mt-0.5 text-emerald-400"/><span>Approved evidence claims count</span></li>
                      <li className="flex items-start gap-1.5"><XCircle size={10} className="shrink-0 mt-0.5 text-destructive"/><span>Self-reported completions do not count</span></li>
                      <li className="flex items-start gap-1.5"><XCircle size={10} className="shrink-0 mt-0.5 text-destructive"/><span>Missing a week resets your streak to 0</span></li>
                    </ul>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground"/>
                  </div>
                )}
              </div>
              <button onClick={()=>setPage("leaderboard")} className="bg-secondary border border-border rounded-[14px] px-4 py-2.5 text-center hover:bg-border transition-colors">
                <div className="flex items-center gap-1.5 justify-center"><Trophy size={15} className="text-amber-500"/><span className="font-bold text-lg text-foreground font-display">#1</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">Henderson-Massey</p>
              </button>
            </div>
          </div>
        </div>

        {/* Next milestone + community challenge */}
        <div className="grid md:grid-cols-2 gap-5">
          <NextMilestoneCard/>
          <CommunityChallenge compact onViewDetails={() => setShowChallengeDetail(true)}/>
        </div>

        {/* Next action */}
        {tabData.awaiting.length>0&&(
          <div className="bg-primary/10 border border-primary/20 rounded-[20px] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><QuestImage imageId={tabData.awaiting[0].imageId} alt={tabData.awaiting[0].title}/></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Ready to complete</p>
              <h3 className="font-medium text-foreground font-display">{tabData.awaiting[0].title}</h3>
              <p className="text-sm text-muted-foreground">Submit evidence to earn {tabData.awaiting[0].xp} XP.</p>
            </div>
            <Btn sm onClick={onOpenCompletion}>{tabData.awaiting[0].verification==="Completion code"?"Enter code":"Submit claim"}<ChevronRight size={14}/></Btn>
          </div>
        )}

        {/* Tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1 border-b border-border min-w-max">
            {TABS.map(({key,label})=>(
              <button key={key} onClick={()=>setTab(key)} className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab===key?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
                {label}{tabData[key].length>0&&<span className="ml-1.5 text-xs bg-secondary rounded-full px-1.5 py-0.5">{tabData[key].length}</span>}
              </button>
            ))}
          </div>
        </div>

        {tabData[tab].length===0?(
          <EmptyState sm icon={tab==="upcoming"?Compass:tab==="review"?BarChart2:tab==="completed"?Award:Target}
            title={tab==="upcoming"?"No active missions":tab==="awaiting"?"Nothing ready to complete":tab==="review"?"No claims under review":"No completed quests yet"}
            desc={tab==="upcoming"?"Browse quests and join some to get started.":"Complete a joined quest to see it here."}
            action={tab==="upcoming"?"Discover quests":undefined} onAction={()=>setPage("discover")}/>
        ):(
          <div className="space-y-4">
            {tabData[tab].map(q=>(
              <div key={q.id} className="bg-card border border-border rounded-[20px] overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-40 h-36 sm:h-auto shrink-0 relative">
                  <QuestImage imageId={q.imageId} alt={q.title} className="w-full h-full"/>
                  <div className="absolute top-2 left-2"><CategoryEmblem category={q.category} size={28}/></div>
                </div>
                <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap gap-2"><CategoryBadge category={q.category} sm/><StatusChip s={q.chipStatus}/></div>
                    <h3 className="font-medium text-foreground font-display">{q.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={11} strokeWidth={2.5}/>{q.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={2.5}/>{q.community?`${q.community}, `:""}{q.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2"><XPPill xp={q.xp} sm/><DiffBadge d={q.difficulty}/></div>
                    {q.memberStatus==="joined"&&<p className="text-xs text-primary font-semibold">Next step: Attend the event then enter the completion code</p>}
                    {q.memberStatus==="awaiting"&&<p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Ready to complete · Submit your evidence to earn XP</p>}
                  </div>
                  <div className="flex sm:flex-col gap-2 items-start sm:items-end shrink-0">
                    {q.primaryAction&&<Btn sm onClick={()=>{if(q.primaryAction?.includes("code")||q.primaryAction?.includes("claim"))onOpenCompletion();else if(q.primaryAction?.includes("share"))setPage("share-card");else setPage("quest-detail");}}>{q.primaryAction}</Btn>}
                    <Btn variant="outline" sm onClick={()=>setPage("quest-detail")}>Details</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements preview */}
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <div>
            <h2 className="font-medium text-lg text-foreground mb-4 font-display">Achievements</h2>
            <div className="space-y-2">
              {ACHIEVEMENTS.filter(a=>a.earned).map(a=>(
                <div key={a.id} className="bg-card border border-border rounded-[16px] p-4 flex items-center gap-3">
                  <AchievementBadgeSVG achievement={a} size={40}/>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm text-foreground font-display">{a.name}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                  <CheckCircle2 size={16} className="text-primary shrink-0" strokeWidth={2.5}/>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4"><h2 className="font-medium text-lg text-foreground font-display">Passport preview</h2><Btn variant="ghost" sm onClick={()=>setPage("passport")}>View full<ChevronRight size={13}/></Btn></div>
            <div className="space-y-2">
              {TIMELINE.slice(0,4).map(t=>(
                <div key={t.id} className="bg-card border border-border rounded-[16px] p-3 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0"><QuestImage imageId={t.imageId} alt={t.title}/></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{t.title}</p><p className="text-xs text-muted-foreground">{t.date}</p></div>
                  {t.verified?<XPPill xp={t.xp} sm/>:<span className="text-xs text-muted-foreground shrink-0">Passport only</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLevelModal && <LevelDetailModal onClose={() => setShowLevelModal(false)}/>}
      {showChallengeDetail && <ChallengeDetailModal onClose={() => setShowChallengeDetail(false)}/>}
    </div>
  );
}

// ── Completion Modal ──────────────────────────────────────────────────────────

function CompletionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<CompletionStep>("choose");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [claimText, setClaimText] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [claimLink, setClaimLink] = useState("");
  const [declared, setDeclared] = useState(false);
  const [claimErrors, setClaimErrors] = useState<Record<string,string>>({});
  const [selfNotes, setSelfNotes] = useState("");

  const submitCode = () => {
    setStep("code-loading");
    setTimeout(() => {
      if (code.length >= 5) { setStep("success"); setTimeout(() => { onClose(); onSuccess(); }, 1500); }
      else { setCodeError("That code is invalid or has expired. Check with your organiser and try again."); setStep("code-error"); }
    }, 1200);
  };

  const submitClaim = () => {
    const errs: Record<string,string> = {};
    if (!claimDate) errs.date = "Please enter the date you participated.";
    if (claimText.length < 20) errs.desc = "Please describe how you participated (at least 20 characters).";
    if (!declared) errs.declared = "You must confirm the declaration to submit.";
    if (Object.keys(errs).length) { setClaimErrors(errs); return; }
    setStep("claim-submitted");
  };

  const renderStep = () => {
    switch(step) {
      case "choose": return (
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-foreground font-display">How did you complete it?</h2>
          <p className="text-sm text-muted-foreground">Verified methods earn XP — self-reported does not.</p>
          <div className="space-y-3">
            {[{Icon:Shield,label:"Enter completion code",desc:"6-char code from the organiser at the event",step:"code"as CompletionStep,xp:true},{Icon:CheckCircle2,label:"Submit completion claim",desc:"Description and optional evidence link for review",step:"claim"as CompletionStep,xp:true},{Icon:Info,label:"Add self-reported completion",desc:"Passport record only — no XP, streak, or leaderboard credit",step:"self"as CompletionStep,xp:false}].map(({Icon,label,desc,step:s,xp})=>(
              <button key={s} onClick={()=>setStep(s)} className="w-full bg-card border border-border rounded-[16px] p-4 flex items-center gap-4 hover:border-primary/40 transition-colors text-left group min-h-[60px]">
                <div className="w-10 h-10 rounded-xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors"><Icon size={18} className="text-muted-foreground group-hover:text-primary" strokeWidth={2.5}/></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm text-foreground font-display">{label}</p><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
                {xp?<XPPill xp={100} sm/>:<span className="text-xs font-semibold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full shrink-0">No XP</span>}
              </button>
            ))}
          </div>
        </div>
      );

      case "code": case "code-error": return (
        <div className="space-y-5">
          <button onClick={()=>{setStep("choose");setCode("");setCodeError("");}} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft size={15}/>Back</button>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center"><Shield size={18} className="text-violet-600" strokeWidth={2.5}/></div><div><h2 className="text-lg font-medium text-foreground font-display">Enter completion code</h2><p className="text-xs text-muted-foreground">6-character code from your organiser</p></div></div>
          <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));setCodeError("");setStep("code");}} maxLength={6} placeholder="HARB01"
            className={`w-full text-center text-2xl font-bold tracking-[0.4em] py-4 rounded-[14px] border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase font-display ${step==="code-error"?"border-destructive":"border-border"}`}/>
          {step==="code-error"&&<div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-[12px] p-3"><XCircle size={15} className="shrink-0 mt-0.5" strokeWidth={2.5}/><p>{codeError}</p></div>}
          <Btn className="w-full" onClick={submitCode} disabled={code.length<4}>Submit code</Btn>
          <p className="text-xs text-center text-muted-foreground opacity-60">Demo: 5+ chars = success, fewer = error</p>
        </div>
      );

      case "code-loading": return (
        <div className="text-center py-10 space-y-4"><RefreshCw size={32} className="mx-auto text-primary animate-spin"/><p className="font-semibold text-foreground font-display">Checking code…</p></div>
      );

      case "claim": return (
        <div className="space-y-5">
          <button onClick={()=>setStep("choose")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft size={15}/>Back</button>
          <h2 className="text-lg font-medium text-foreground font-display">Submit completion claim</h2>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold text-foreground mb-1.5">Participation date <span className="text-destructive">*</span></label>
              <input type="date" value={claimDate} onChange={e=>{setClaimDate(e.target.value);setClaimErrors({...claimErrors,date:""}); }} className={`w-full px-3 py-2.5 rounded-[14px] border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm ${claimErrors.date?"border-destructive":"border-border"}`}/>
              {claimErrors.date&&<p className="text-xs text-destructive mt-1">{claimErrors.date}</p>}
            </div>
            <div><label className="block text-xs font-bold text-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
              <textarea value={claimText} onChange={e=>{setClaimText(e.target.value);setClaimErrors({...claimErrors,desc:""}); }} maxLength={500} rows={4} placeholder="Describe how you participated…" className={`w-full px-3 py-2.5 rounded-[14px] border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none ${claimErrors.desc?"border-destructive":"border-border"}`}/>
              <div className="flex justify-between mt-0.5">{claimErrors.desc?<p className="text-xs text-destructive">{claimErrors.desc}</p>:<span/>}<span className={`text-xs ${claimText.length>480?"text-amber-600":"text-muted-foreground"}`}>{claimText.length}/500</span></div>
            </div>
            <div><label className="block text-xs font-bold text-foreground mb-1.5">Evidence link <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input value={claimLink} onChange={e=>setClaimLink(e.target.value)} placeholder="https://…" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"/>
            </div>
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-[12px] border transition-colors ${claimErrors.declared?"border-destructive bg-destructive/5":"border-border hover:bg-secondary"}`}>
              <input type="checkbox" checked={declared} onChange={e=>{setDeclared(e.target.checked);setClaimErrors({...claimErrors,declared:""}); }} className="mt-0.5 accent-primary"/>
              <span className="text-xs text-muted-foreground leading-relaxed">I declare that I genuinely completed this quest. False claims may result in account suspension.</span>
            </label>
          </div>
          <Btn className="w-full" onClick={submitClaim}>Submit claim</Btn>
        </div>
      );

      case "claim-submitted": return (
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto"><CheckCircle2 size={28} className="text-sky-600" strokeWidth={2.5}/></div>
          <h2 className="text-xl font-medium text-foreground font-display">Claim submitted</h2>
          <p className="text-sm text-muted-foreground">Our team will review within 2–3 days.</p>
          <div className="flex gap-3"><Btn variant="outline" className="flex-1" onClick={onClose}>Close</Btn><Btn className="flex-1" onClick={onClose}>View Passport</Btn></div>
        </div>
      );

      case "self": return (
        <div className="space-y-5">
          <button onClick={()=>setStep("choose")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft size={15}/>Back</button>
          <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0"><Info size={18} className="text-zinc-500" strokeWidth={2.5}/></div><div><h2 className="text-lg font-medium text-foreground font-display">Self-reported completion</h2><span className="inline-block mt-1 text-xs font-bold bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">Passport only · No XP</span></div></div>
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4"><p className="font-semibold text-sm text-amber-800">Self-reported completions are Passport-only.</p><p className="text-xs text-amber-700/80 mt-1">They earn no XP, streak credit, or leaderboard position.</p></div>
          <div><label className="block text-xs font-bold text-foreground mb-1.5">Personal notes (optional)</label><textarea value={selfNotes} onChange={e=>setSelfNotes(e.target.value)} rows={3} placeholder="Notes for your own Passport record…" className="w-full px-3 py-2.5 rounded-[14px] border border-border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"/></div>
          <Btn variant="secondary" className="w-full" onClick={()=>setStep("self-done")}>Record in Passport</Btn>
        </div>
      );

      case "self-done": return (
        <div className="text-center space-y-4 py-4"><div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto"><Check size={26} className="text-zinc-500" strokeWidth={2.5}/></div><h2 className="text-lg font-medium text-foreground font-display">Added to Passport</h2><p className="text-sm text-muted-foreground">Self-reported completion recorded. No XP was awarded.</p><Btn variant="outline" className="w-full" onClick={onClose}>Close</Btn></div>
      );

      case "success": return (
        <div className="text-center space-y-4 py-4"><div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CheckCircle2 size={28} className="text-primary" strokeWidth={2.5}/></div><h2 className="text-xl font-medium text-foreground font-display">Code accepted!</h2><XPPill xp={100}/><p className="text-sm text-muted-foreground">+100 XP added. Loading your reward…</p></div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={()=>{if(step!=="code-loading"&&step!=="success")onClose();}}/>
      <div className="relative bg-card rounded-t-[24px] sm:rounded-[24px] w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          {step!=="success"&&step!=="code-loading"&&step!=="claim-submitted"&&step!=="self-done"&&<button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary z-10"><X size={16}/></button>}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// ── Reward Overlay — 7-frame sequence ─────────────────────────────────────────

function RewardOverlay({ onClose, setPage, reducedMotion }: { onClose: () => void; setPage: (p: Page) => void; reducedMotion: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) { setPhase(7); return; }
    const timers = [300, 900, 1500, 2200, 2800, 3400, 4000].map((d,i) => setTimeout(() => setPhase(i+1), d));
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  const stars = Array.from({length:10},(_,i)=>({x:15+Math.random()*70,y:15+Math.random()*70,delay:i*80}));

  return (
    <div className="fixed inset-0 z-50 bg-primary flex flex-col items-center justify-center text-primary-foreground px-4 text-center overflow-hidden">
      {phase>=1&&!reducedMotion&&stars.map((s,i)=>(
        <div key={i} className="absolute pointer-events-none animate-bounce" style={{left:`${s.x}%`,top:`${s.y}%`,animationDelay:`${s.delay}ms`,animationDuration:"1s"}}>
          <Sparkles size={10+Math.random()*14} className="text-accent opacity-70"/>
        </div>
      ))}
      <TopoDecor className="w-full h-full absolute inset-0 text-primary-foreground opacity-10"/>
      {reducedMotion&&<div className="absolute top-4 left-4 bg-primary-foreground/10 rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"><VolumeX size={12}/>Reduced motion</div>}
      {!reducedMotion&&<button onClick={()=>setPhase(7)} className="absolute top-5 right-5 flex items-center gap-1.5 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity z-10"><SkipForward size={14}/>Skip</button>}

      <div className="relative space-y-5 max-w-sm w-full">
        <div className={`${reducedMotion?"":"transition-all duration-500"} ${phase>=1||reducedMotion?"opacity-100":"opacity-0 translate-y-4"}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <CheckCircle2 size={28} className="text-accent" strokeWidth={2.5}/>
            <h1 className="font-medium font-display text-3xl">Quest verified!</h1>
          </div>
        </div>

        {(phase>=2||reducedMotion)&&(
          <div className={`bg-primary-foreground/10 rounded-[20px] p-4 ${reducedMotion?"":"animate-in fade-in duration-500"}`}>
            <p className="text-xs opacity-60 uppercase tracking-widest mb-2">XP earned</p>
            <div className="flex items-center justify-center gap-3 mb-3"><Zap size={24} className="text-accent" strokeWidth={2.5}/><span className="text-4xl font-bold font-display">+100 XP</span></div>
            <PBar val={phase>=3||reducedMotion?80:35} max={100} h="h-2.5"/>
            <p className="text-xs opacity-60 mt-1">420 → 520 XP toward Level 8</p>
          </div>
        )}

        {(phase>=3||reducedMotion)&&(
          <div className={`bg-primary-foreground/10 rounded-[20px] px-6 py-4 ${reducedMotion?"":"animate-in fade-in duration-500"}`}>
            <p className="text-xs opacity-60 uppercase tracking-widest mb-2">Level progress</p>
            <div className="flex items-center justify-center gap-4"><RankCrest rankTitle="Novice" size={40}/><div><p className="text-3xl font-medium font-display">Level 7</p><p className="text-sm opacity-70">Novice · 105 XP to Level 8</p></div></div>
          </div>
        )}

        {(phase>=4||reducedMotion)&&(
          <div className={`bg-primary-foreground/10 rounded-[16px] p-4 flex items-center gap-4 ${reducedMotion?"":"animate-in fade-in duration-500"}`}>
            <AchievementBadgeSVG achievement={{...ACHIEVEMENTS[1], earned: true}} size={44}/>
            <div className="text-left flex-1"><p className="text-xs opacity-60 mb-0.5">Achievement unlocked!</p><p className="font-medium font-display">Local Helper</p><p className="text-xs opacity-70">Complete 5 quests</p></div>
            <CheckCircle2 size={18} className="text-accent shrink-0" strokeWidth={2.5}/>
          </div>
        )}

        {(phase>=5||reducedMotion)&&(
          <div className={`bg-primary-foreground/10 rounded-[16px] p-4 ${reducedMotion?"":"animate-in fade-in duration-500"}`}>
            <p className="text-xs opacity-60 mb-2">Henderson-Massey community progress</p>
            <div className="flex items-center justify-between mb-2"><span className="font-medium font-display text-sm">July Challenge</span><span className="text-sm font-bold text-accent">43 / 50</span></div>
            <PBar val={43} max={50} h="h-2"/>
            <p className="text-xs opacity-60 mt-1">7 quests remaining · 12 days left</p>
          </div>
        )}

        {(phase>=6||reducedMotion)&&(
          <div className={`bg-primary-foreground/10 rounded-[16px] p-3 flex items-center gap-3 ${reducedMotion?"":"animate-in fade-in duration-500"}`}>
            <Award size={20} className="text-accent shrink-0"/>
            <p className="text-sm font-semibold">Passport updated — Restore Nature 2/3</p>
          </div>
        )}

        {(phase>=7||reducedMotion)&&(
          <div className={`flex flex-col sm:flex-row gap-3 mt-2 ${reducedMotion?"":"animate-in fade-in duration-300"}`}>
            <Btn variant="secondary" onClick={()=>{onClose();setPage("passport");}}>View Passport</Btn>
            <Btn variant="secondary" onClick={()=>{onClose();setPage("discover");}}>Find another Quest</Btn>
            <Btn variant="secondary" onClick={()=>{onClose();setPage("share-card");}}>Share Card</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Passport Page ─────────────────────────────────────────────────────────────

function PassportPage({ setPage, homeCommunity }: { setPage: (p: Page) => void; homeCommunity: string }) {
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState<string|null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

  const filtered = TIMELINE.filter(t => {
    if (filter==="verified"&&!t.verified) return false;
    if (filter==="self"&&t.verified) return false;
    if (catFilter&&t.category!==catFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Identity header */}
        <div className="bg-primary text-primary-foreground rounded-[24px] p-6 relative overflow-hidden">
          <TopoDecor className="w-full h-full absolute inset-0 text-primary-foreground"/>
          <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <RankCrest rankTitle="Novice" size={64}/>
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-medium font-display">Mia K.</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm opacity-80">Level 7 · Novice</span>
                  {homeCommunity&&<span className="text-xs font-bold bg-primary-foreground/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-primary-foreground/20"><Home size={10} strokeWidth={2.5}/>{homeCommunity} Contributor</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm">
                <span className="flex items-center gap-1.5 opacity-90"><CheckCircle2 size={14} strokeWidth={2.5}/><strong>4</strong>&nbsp;verified quests</span>
                <span className="flex items-center gap-1.5 opacity-90"><Flame size={14}/><strong>3</strong>-week streak</span>
              </div>
            </div>
            <div className="w-full sm:w-auto space-y-1.5">
              <div className="flex items-center justify-between gap-8 text-sm"><span className="opacity-70">XP progress</span><span className="font-bold font-display">420 / 525</span></div>
              <PBar val={420} max={525} cls="sm:w-48"/>
              <p className="text-xs opacity-60 text-right">105 XP to Level 8</p>
            </div>
          </div>
          {homeCommunity&&<button onClick={()=>setPage("leaderboard")} className="relative mt-5 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-[14px] px-4 py-2.5 flex items-center gap-3 text-left border border-primary-foreground/10"><Trophy size={16} className="text-accent shrink-0"/><div><p className="text-xs font-bold">#1 in {homeCommunity} this week</p><p className="text-[10px] opacity-60">View {homeCommunity} leaderboard →</p></div></button>}
        </div>

        {/* Next milestone */}
        <NextMilestoneCard/>

        {/* Category progress */}
        <div>
          <h2 className="font-medium text-xl text-foreground mb-5 font-display">Quest category progress</h2>
          <div className="bg-card border border-border rounded-[20px] p-5 space-y-5">
            {CATS.map(cat => {
              const cfg = CAT_CFG[cat];
              const counts = CAT_QUEST_COUNTS[cat];
              const xp = CAT_XP[cat] || 0;
              const nextBadge = ACHIEVEMENTS.find(a => a.category === cat && !a.earned);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <CategoryEmblem category={cat} size={36}/>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{cat}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{counts.verified} / {counts.total} quests</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${(counts.verified/counts.total)*100}%`,background:cfg.fill}}/>
                    </div>
                    <div className="flex items-center justify-between">
                      {nextBadge?<p className="text-[11px] text-muted-foreground">Next: <span className="text-foreground font-semibold">{nextBadge.name}</span></p>
                        :<p className="text-[11px] text-primary font-semibold">All badges earned!</p>}
                      <span className="text-[11px] text-muted-foreground">{xp} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements collection */}
        <div>
          <div className="flex items-center justify-between mb-5"><h2 className="font-medium text-xl text-foreground font-display">Achievement collection</h2><span className="text-sm text-muted-foreground">2 / 8 earned</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(a=>(
              <div key={a.id} className={`relative bg-card border rounded-[20px] p-4 flex flex-col items-center text-center gap-2 transition-all ${a.earned?"border-primary/30 shadow-sm":"border-border"}`}>
                <AchievementBadgeSVG achievement={a} size={52}/>
                <div><p className={`text-xs font-medium font-display ${a.earned?"text-foreground":"text-muted-foreground"}`}>{a.name}</p><p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{a.desc}</p></div>
                {a.earned
                  ? <span className="text-[10px] font-bold text-primary flex items-center gap-0.5"><CheckCircle2 size={10} strokeWidth={2.5}/>Earned</span>
                  : <div className="w-full space-y-1"><PBar val={a.progress} max={a.total} h="h-1"/><p className="text-[10px] text-muted-foreground">{a.progress}/{a.total}</p></div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Community challenge participation — separate section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-xl text-foreground font-display">Community challenge participation</h2>
          </div>
          <div className="space-y-3">
            {COMMUNITY_CHALLENGE_HISTORY.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-[20px] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <QuestImage imageId="community" alt="Community challenge"/>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <h4 className="font-medium text-sm text-foreground font-display">{c.challenge}</h4>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.status==="in-progress"?"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700":"bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {c.status==="in-progress"?"In progress":"Completed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.date} · {c.contributed?`You contributed ${c.questCount} verified quest${c.questCount>1?"s":""}` : "No contribution yet"}</p>
                  {c.status==="in-progress"&&<p className="text-xs text-primary font-semibold">42 / 50 community quests complete · 12 days left</p>}
                </div>
                <button onClick={() => setShowChallengeDetail(true)} className="text-xs font-semibold text-primary flex items-center gap-1 shrink-0 hover:underline">
                  View details<ChevronRight size={12}/>
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Community challenge records are separate from your personal quest completions below.</p>
        </div>

        {/* Personal completion history — clearly separate from community */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-xl text-foreground font-display">Completion history</h2>
            <Btn sm variant="outline" onClick={()=>setPage("share-card")}><Share2 size={13}/>Create share card</Btn>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Your personal verified and self-reported quest completions.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {[{val:"all",label:"All"},{val:"verified",label:"Verified"},{val:"self",label:"Self reported"}].map(f=>(
              <button key={f.val} onClick={()=>setFilter(f.val)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 transition-colors ${filter===f.val?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary text-foreground"}`}>{f.label}</button>
            ))}
            <div className="flex gap-1 flex-wrap">
              {CATS.map(cat=>(
                <button key={cat} onClick={()=>setCatFilter(catFilter===cat?null:cat)} title={cat} className={`w-8 h-8 rounded-full border transition-colors overflow-hidden flex items-center justify-center ${catFilter===cat?"border-primary ring-2 ring-primary/30":"border-border hover:bg-secondary"}`}>
                  <CategoryEmblem category={cat} size={24}/>
                </button>
              ))}
            </div>
          </div>

          {filtered.length===0?(
            <EmptyState sm icon={Award} title="No matching completions" desc="Try a different filter." action="Show all" onAction={()=>{setFilter("all");setCatFilter(null);}}/>
          ):(
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map(t=>(
                <div key={t.id} className="bg-card border border-border rounded-[20px] overflow-hidden flex gap-0">
                  <div className="relative w-24 shrink-0">
                    <QuestImage imageId={t.imageId} alt={t.title} className="w-full h-full"/>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {t.verified
                        ? <div className="bg-primary/90 rounded-full p-1.5"><Check size={14} className="text-white" strokeWidth={2.5}/></div>
                        : <div className="bg-zinc-600/80 rounded-full p-1.5"><Info size={14} className="text-white" strokeWidth={2.5}/></div>
                      }
                    </div>
                  </div>
                  <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div><h4 className="font-medium text-sm text-foreground font-display leading-snug">{t.title}</h4><p className="text-xs text-muted-foreground mt-0.5">{t.date}</p></div>
                      {t.verified?<XPPill xp={t.xp} sm/>:<span className="text-xs font-semibold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full shrink-0">Passport only</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <CategoryBadge category={t.category} sm/>
                      {t.achievement&&<span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Award size={10}/>{t.achievement}</span>}
                    </div>
                    {t.verified&&<Btn variant="outline" sm onClick={()=>setPage("share-card")}><Share2 size={12}/>Share</Btn>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showChallengeDetail && <ChallengeDetailModal onClose={() => setShowChallengeDetail(false)} community={homeCommunity || "Henderson-Massey"}/>}
    </div>
  );
}

// ── Leaderboard Page ──────────────────────────────────────────────────────────

function LeaderboardPage({ isLoggedIn, homeCommunity }: { isLoggedIn: boolean; homeCommunity: string }) {
  const [lbType, setLbType] = useState<LBType>("people");
  const [geo, setGeo] = useState<LBGeo>(isLoggedIn&&homeCommunity?"my-community":"auckland");
  const [time, setTime] = useState<LBTime>("weekly");
  const [lbStatus] = useState<LBStatus>("live");
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

  const actualCommunityName = homeCommunity || "Henderson-Massey";
  const geoLabel = geo==="my-community" ? actualCommunityName : geo==="auckland" ? "Auckland" : "New Zealand";
  const isMyCommunity = geo==="my-community";

  const statusBadge: Record<LBStatus,React.ReactNode> = {
    live:         <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"/><Wifi size={12}/>Live</div>,
    reconnecting: <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-700 px-3 py-1.5 rounded-full"><RefreshCw size={12} className="animate-spin"/>Reconnecting…</div>,
    unavailable:  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-full"><WifiOff size={12}/>Offline</div>,
  };

  const displayData = isMyCommunity ? COMMUNITY_LB : LB_DATA;
  const top3 = displayData.slice(0,3);
  const rest = displayData.slice(3);
  const podiumOrder = [top3[1],top3[0],top3[2]].filter(Boolean);
  const podiumH = ["h-24","h-36","h-20"];
  const podiumBg = ["bg-zinc-200 dark:bg-zinc-700","bg-amber-100 dark:bg-amber-900/50","bg-orange-100 dark:bg-orange-900/40"];
  const podiumRankTxt = ["text-zinc-500","text-amber-600 dark:text-amber-400","text-orange-600 dark:text-orange-400"];

  return (
    <div className="min-h-screen py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-[900px] mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-medium text-foreground font-display">Leaderboard</h1>
            <p className="text-muted-foreground mt-1">Verified eco quest completions across Kiwimpact.</p>
          </div>
          {statusBadge[lbStatus]}
        </div>

        {/* People / Communities tab */}
        <div className="flex bg-secondary rounded-[14px] p-1 gap-0.5 w-fit border border-border">
          <button onClick={() => setLbType("people")} className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${lbType==="people"?"bg-foreground text-background":"text-muted-foreground hover:text-foreground"}`}>
            <Users size={15} strokeWidth={2.5}/>People
          </button>
          <button onClick={() => setLbType("communities")} className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all min-h-[44px] flex items-center gap-2 ${lbType==="communities"?"bg-foreground text-background":"text-muted-foreground hover:text-foreground"}`}>
            <Globe size={15} strokeWidth={2.5}/>Communities
          </button>
        </div>

        {lbType === "communities" ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-medium text-lg text-foreground font-display mb-1">Community rankings</h2>
              <p className="text-sm text-muted-foreground">Aggregated verified quest data across Auckland communities. Ranked by average quests per active member to level the playing field.</p>
            </div>

            <div className="bg-card border border-border rounded-[20px] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[44px_1fr_80px_80px_80px_90px] gap-3 px-4 py-2.5 border-b border-border bg-secondary text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <span>#</span><span>Community</span><span className="text-center">Quests</span><span className="text-center">Members</span><span className="text-center">Avg/member</span><span className="text-center">Categories</span>
              </div>
              {COMMUNITY_COMPARISON.map(c => (
                <div key={c.name} className={`grid grid-cols-[44px_1fr_auto] sm:grid-cols-[44px_1fr_80px_80px_80px_90px] gap-3 px-4 py-3.5 border-b border-border last:border-0 items-center ${c.isHome?"bg-primary/5":""}`}>
                  <div className="flex items-center">
                    {c.rank <= 3 ? <MedalArtwork pos={c.rank as 1|2|3}/> : <span className="font-bold text-sm text-muted-foreground font-display">{c.rank}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}{c.isHome&&<span className="text-xs font-normal text-primary ml-1.5">(yours)</span>}</p>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden mt-1.5 max-w-[120px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" style={{width:`${(c.quests/COMMUNITY_COMPARISON[0].quests)*100}%`}}/>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground text-center">{c.quests}</span>
                  <span className="text-sm text-muted-foreground text-center hidden sm:block">{c.contributors}</span>
                  <span className="text-sm font-semibold text-primary text-center hidden sm:block">{c.avgPerMember.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground text-center hidden sm:block">{c.categories}/6</span>
                </div>
              ))}
            </div>

            <div className="bg-secondary border border-border rounded-[16px] p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-bold text-foreground text-xs">About community ranking</p>
              <p>Ranked by average verified quests per active member so smaller communities can compete fairly with larger ones.</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-base text-foreground font-display">Henderson-Massey July Challenge</h3>
              <CommunityChallenge compact onViewDetails={() => setShowChallengeDetail(true)}/>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Scope + time controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-secondary rounded-[14px] p-1 gap-0.5 overflow-x-auto border border-border">
                {isLoggedIn && actualCommunityName && (
                  <button onClick={()=>setGeo("my-community")} className={`flex flex-col items-center px-4 py-2 rounded-[10px] text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] justify-center ${geo==="my-community"?"bg-foreground text-background":"text-muted-foreground hover:text-foreground"}`}>
                    <span>{actualCommunityName}</span>
                    <span className="text-[10px] opacity-60 font-normal">My Community</span>
                  </button>
                )}
                <button onClick={()=>setGeo("auckland")} className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all min-h-[44px] ${geo==="auckland"?"bg-foreground text-background":"text-muted-foreground hover:text-foreground"}`}>Auckland</button>
                <button onClick={()=>setGeo("new-zealand")} className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap ${geo==="new-zealand"?"bg-foreground text-background":"text-muted-foreground hover:text-foreground"}`}>New Zealand</button>
              </div>
              <div className="flex bg-secondary rounded-[14px] p-1 gap-0.5 border border-border">
                {(["weekly","monthly","alltime"]as LBTime[]).map(t=><button key={t} onClick={()=>setTime(t)} className={`flex-1 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all min-h-[44px] ${time===t?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`}>{t==="alltime"?"All time":t==="monthly"?"Monthly":"Weekly"}</button>)}
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-secondary border border-border rounded-[10px] px-3 py-2 text-center">
              Viewing {geoLabel} scope. This does not change your Home Community — change that in Profile Settings.
            </p>

            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg text-foreground font-display">{geoLabel} · {time==="weekly"?"This week":time==="monthly"?"This month":"All time"}</h2>
              {isLoggedIn&&<div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp size={12}/>Personal best: <span className="font-bold text-foreground">#{CURRENT_USER_LB.personalBest}</span></div>}
            </div>

            {isMyCommunity&&COMMUNITY_LB.length<5?(
              <div className="bg-card border border-border rounded-[20px] p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Users size={24} className="text-primary" strokeWidth={2.5}/></div>
                <h3 className="font-medium text-lg text-foreground font-display">{actualCommunityName} is still growing</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">A full leaderboard needs more active contributors. Keep completing quests — you're helping build it.</p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {[{n:4,l:"verified quests"},{n:2,l:"contributors"},{n:2,l:"categories"}].map(({n,l})=>(
                    <div key={l} className="bg-secondary border border-border rounded-[14px] p-3 text-center"><p className="font-medium text-2xl text-foreground font-display">{n}</p><p className="text-[10px] text-muted-foreground leading-snug">{l}</p></div>
                  ))}
                </div>
                <Btn variant="outline" onClick={()=>setGeo("auckland")}>View Auckland leaderboard<ChevronRight size={14}/></Btn>
              </div>
            ):(
              <>
                {isMyCommunity&&(
                  <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-5">
                    <h3 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2 font-display"><Activity size={15} className="text-primary" strokeWidth={2.5}/>{actualCommunityName} · {time==="weekly"?"This week":time==="monthly"?"This month":"All time"}</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[{n:"42",l:"verified quests"},{n:"18",l:"active contributors"},{n:"6",l:"categories covered"}].map(({n,l})=>(
                        <div key={l} className="bg-card border border-border rounded-[14px] p-3 text-center"><p className="font-medium text-2xl text-primary font-display">{n}</p><p className="text-xs text-muted-foreground leading-snug mt-0.5">{l}</p></div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs"><span className="font-semibold text-foreground">July Challenge: 50 verified quests</span><span className="font-bold text-primary">42 / 50</span></div>
                      <PBar val={42} max={50} h="h-2.5"/>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">8 remaining · 12 days left · Reward: Local Changemakers badge</p>
                        <button onClick={() => setShowChallengeDetail(true)} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline whitespace-nowrap">Details<ChevronRight size={12}/></button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Podium */}
                <div className="flex items-end justify-center gap-4 pt-4 pb-2">
                  {podiumOrder.map((u,i)=>(
                    <div key={u.rank} className="flex flex-col items-center gap-2">
                      <MedalArtwork pos={i===1?1:i===0?2:3}/>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-display font-bold text-sm text-primary">{u.av}</div>
                      <div className="text-center"><p className="text-xs font-bold text-foreground">{u.name}</p><p className="text-[10px] text-muted-foreground">{typeof u.xp==="number"?u.xp.toLocaleString():u.xp} XP</p><RankCrest rankTitle={u.rankTitle} size={18}/></div>
                      <div className={`w-20 ${podiumH[i]} rounded-t-[12px] ${podiumBg[i]} flex items-start justify-center pt-2`}><span className={`text-xl font-bold font-display ${podiumRankTxt[i]}`}>{i===1?1:i===0?2:3}</span></div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-[20px] overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[44px_1fr_60px_80px_100px] gap-3 px-4 py-2.5 border-b border-border bg-secondary text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <span>#</span><span>Player</span><span className="text-center">Move</span><span className="text-right">Quests</span><span className="text-right">XP</span>
                  </div>
                  {rest.map(u=>{
                    const isMe=(u as any).isMe;
                    return (
                      <div key={u.rank} className={`grid grid-cols-[44px_1fr_auto] sm:grid-cols-[44px_1fr_60px_80px_100px] gap-3 px-4 py-3 border-b border-border last:border-0 items-center transition-colors ${isMe?"bg-primary/5":"hover:bg-secondary/50"}`}>
                        <span className="font-bold text-sm text-muted-foreground font-display">{u.rank}</span>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <RankCrest rankTitle={u.rankTitle} size={28}/>
                          <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate">{u.name}{isMe&&<span className="text-xs font-normal text-primary ml-1">(you)</span>}</p><p className="text-xs text-muted-foreground">Lv {u.level} · {u.rankTitle}</p></div>
                        </div>
                        <div className="text-center hidden sm:flex justify-center"><RankMovement now={u.rank} prev={(u as any).prev||u.rank}/></div>
                        <span className="text-sm font-semibold text-foreground text-right hidden sm:block">{u.quests}</span>
                        <div className="text-right"><XPPill xp={u.xp as any} sm/></div>
                      </div>
                    );
                  })}
                </div>

                {isLoggedIn&&!isMyCommunity&&(
                  <div className="bg-primary/10 border border-primary/30 rounded-[16px] px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0"><span className="font-bold text-primary text-sm font-display">#{CURRENT_USER_LB.rank}</span><RankMovement now={CURRENT_USER_LB.rank} prev={CURRENT_USER_LB.prev}/></div>
                      <RankCrest rankTitle={CURRENT_USER_LB.rankTitle} size={28}/>
                      <div className="flex-1 min-w-0"><p className="text-sm font-bold text-foreground truncate">{CURRENT_USER_LB.name}<span className="text-xs font-normal text-primary ml-1">(you)</span></p><p className="text-xs text-muted-foreground">Lv {CURRENT_USER_LB.level} · {CURRENT_USER_LB.rankTitle} · Personal best #{CURRENT_USER_LB.personalBest}</p></div>
                      <XPPill xp={CURRENT_USER_LB.xp as any} sm/>
                    </div>
                    <p className="text-xs text-primary font-semibold flex items-center gap-1.5"><ArrowUpRight size={12}/>You are #{CURRENT_USER_LB.rank} — earn 150 XP to reach #{CURRENT_USER_LB.rank - 1}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showChallengeDetail && <ChallengeDetailModal onClose={() => setShowChallengeDetail(false)} community={homeCommunity || "Henderson-Massey"}/>}
    </div>
  );
}

// ── Share Card Page ───────────────────────────────────────────────────────────

function ShareCardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [showName, setShowName] = useState(true);
  const [cardTheme, setCardTheme] = useState<CardTheme>("nature");
  const [colorScheme, setColorScheme] = useState<CardColorScheme>("dark");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const verifiedItems = TIMELINE.filter(t=>t.verified);
  const item = verifiedItems[selectedIdx];

  type ThemeDef = { imageId: string; overlay: string; category: string; };
  const THEMES: Record<CardTheme,ThemeDef> = {
    nature:   { imageId: "quest1", overlay: colorScheme==="dark"?"bg-gradient-to-t from-[#0d2018]/95 via-[#0d2018]/60 to-[#0d2018]/30":"bg-gradient-to-t from-emerald-900/80 via-emerald-700/50 to-transparent", category: "Restore Nature" },
    wildlife: { imageId: "quest5", overlay: colorScheme==="dark"?"bg-gradient-to-t from-[#060e1e]/95 via-[#060e1e]/60 to-[#060e1e]/30":"bg-gradient-to-t from-blue-900/80 via-blue-700/50 to-transparent", category: "Protect Wildlife" },
    waste:    { imageId: "quest3", overlay: colorScheme==="dark"?"bg-gradient-to-t from-[#1c0a00]/95 via-[#1c0a00]/60 to-[#1c0a00]/30":"bg-gradient-to-t from-orange-900/80 via-orange-700/50 to-transparent", category: "Clean & Reduce Waste" },
  };
  const t = THEMES[cardTheme];

  return (
    <div className="min-h-screen py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-medium text-foreground mb-1 font-display">Share Card Builder</h1>
        <p className="text-muted-foreground mb-8">Create a personal achievement card from your verified completions.</p>

        {/* Controls left, prominent live preview right */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">

          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-foreground font-display">Select completion</h3>
              {verifiedItems.map((v,i)=>(
                <label key={v.id} className={`flex items-center gap-3 p-3 rounded-[14px] border cursor-pointer transition-colors ${selectedIdx===i?"border-primary bg-primary/5":"border-border hover:bg-secondary"}`}>
                  <input type="radio" checked={selectedIdx===i} onChange={()=>setSelectedIdx(i)} className="accent-primary shrink-0"/>
                  <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0"><QuestImage imageId={v.imageId} alt={v.title}/></div>
                  <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate font-display">{v.title}</p><p className="text-xs text-muted-foreground">{v.date} · +{v.xp} XP</p></div>
                </label>
              ))}
            </div>

            <div className="bg-card border border-border rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-foreground font-display">Visual theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(THEMES)as CardTheme[]).map(k=>(
                  <button key={k} onClick={()=>setCardTheme(k)} className={`p-2 rounded-[12px] border text-xs font-semibold transition-all flex flex-col items-center gap-1.5 overflow-hidden ${cardTheme===k?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground hover:bg-secondary"}`}>
                    <div className="w-full h-10 rounded-[8px] overflow-hidden"><QuestImage imageId={THEMES[k].imageId} alt={k}/></div>
                    <span className="capitalize">{k}</span>
                  </button>
                ))}
              </div>
              <div><p className="text-sm font-semibold text-foreground mb-2">Overlay</p>
                <div className="flex gap-2">{(["light","dark"]as CardColorScheme[]).map(s=><button key={s} onClick={()=>setColorScheme(s)} className={`flex-1 py-2 rounded-[10px] border text-xs font-semibold transition-all ${colorScheme===s?"border-primary bg-primary/5 text-primary":"border-border text-muted-foreground hover:bg-secondary"}`}>{s==="light"?"Light":"Dark"}</button>)}</div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[20px] p-5 space-y-3">
              <h3 className="font-medium text-base text-foreground font-display">Options</h3>
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-foreground">Show display name</p><p className="text-xs text-muted-foreground">Shows "Mia K." on the card</p></div><Toggle on={showName} onToggle={()=>setShowName(!showName)}/></div>
            </div>

            <div className="space-y-2">
              <Btn className="w-full"><Download size={16}/>Download PNG</Btn>
              <Btn variant="outline" className="w-full"><Share2 size={16}/>Share</Btn>
            </div>

            <div className="bg-secondary border border-border rounded-[14px] p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground text-xs">Privacy — never shown on card</p>
              <ul className="space-y-0.5">{["Home community or precise location","Evidence or claim text","Email or user ID"].map(item=><li key={item} className="flex items-center gap-1.5"><X size={9} className="text-muted-foreground/60 shrink-0"/>{item}</li>)}</ul>
            </div>
          </div>

          {/* Prominent live preview — full aspect-square */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full max-w-[560px]">
              <div>
                <p className="text-sm font-semibold text-foreground">Live preview</p>
                <p className="text-xs text-muted-foreground">This is exactly what your card will look like.</p>
              </div>
              <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-full">1080 × 1080 px</span>
            </div>
            <div className="w-full max-w-[560px] aspect-square shadow-2xl">
              <div className="w-full h-full rounded-[24px] overflow-hidden relative border-2 border-border">
                <QuestImage imageId={t.imageId} alt={`Share card background`} className="absolute inset-0 w-full h-full"/>
                <div className={`absolute inset-0 ${t.overlay}`}/>
                <div className="relative w-full h-full p-7 flex flex-col justify-between text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center border border-white/20"><Leaf size={14} className="text-white" strokeWidth={2.5}/></div>
                      <span className="text-sm font-medium font-display">Kiwimpact</span>
                    </div>
                    <CategoryEmblem category={t.category} size={52}/>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs opacity-60 font-semibold uppercase tracking-widest mb-1">{item.category}</p>
                      <h2 className="text-2xl font-medium leading-tight font-display">{item.title}</h2>
                      <p className="text-sm text-white/70 mt-1">{item.date}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white/20 border border-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={11} strokeWidth={2.5}/>Verified</span>
                      <span className="bg-white/20 border border-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Zap size={11} strokeWidth={2.5}/>+{item.xp} XP</span>
                      {item.achievement&&<span className="bg-white/20 border border-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Award size={11}/>{item.achievement}</span>}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        {showName&&<p className="font-medium text-xl font-display">Mia K.</p>}
                        <div className="flex items-center gap-1.5"><RankCrest rankTitle="Novice" size={20}/><p className="text-xs text-white/70">Level 7 · Novice</p></div>
                      </div>
                      <p className="text-[10px] text-white/50 text-right">kiwimpact.nz</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [dark, setDark] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [homeCommunity, setHomeCommunity] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  const hasHomeCommunity = isLoggedIn && homeCommunity !== "";
  const hasJoinedQuests = isLoggedIn && QUESTS.some(q => q.memberStatus === "joined");

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const navigate = useCallback((p: Page, id?: number) => {
    if (id !== undefined) setSelectedQuest(id);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav page={page} setPage={navigate} dark={dark} setDark={setDark} isLoggedIn={isLoggedIn} setLoggedIn={setLoggedIn}/>

      {/* Demo controls */}
      <div className="bg-secondary/80 border-b border-border px-4 py-2 flex items-center justify-center gap-3 text-xs flex-wrap">
        <span className="font-bold text-muted-foreground">Demo</span>
        <span className="w-px h-3 bg-border"/>
        <button onClick={()=>setLoggedIn(!isLoggedIn)} className="font-semibold text-primary hover:underline">{isLoggedIn?"→ Guest view":"→ Member view (Mia K.)"}</button>
        {isLoggedIn&&<>
          <span className="w-px h-3 bg-border"/>
          <button onClick={()=>setShowCommunitySelector(true)} className="font-semibold text-primary hover:underline flex items-center gap-1"><Home size={10}/>{homeCommunity||"Set community"}</button>
          <span className="w-px h-3 bg-border"/>
          <button onClick={()=>setReducedMotion(!reducedMotion)} className="font-semibold text-muted-foreground hover:underline flex items-center gap-1">{reducedMotion?<><Play size={10}/>Full motion</>:<><VolumeX size={10}/>Reduced motion</>}</button>
        </>}
        <span className="w-px h-3 bg-border hidden sm:block"/>
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {(["landing","discover","quest-detail","my-quests","passport","leaderboard","share-card"]as Page[]).map(p=>(
            <button key={p} onClick={()=>navigate(p)} className={`transition-colors capitalize hover:text-primary ${page===p?"text-primary font-bold":""}`}>{p.replace(/-/g," ")}</button>
          ))}
        </div>
      </div>

      <div className={isLoggedIn?"pb-16 md:pb-0":""}>
        {page==="landing"&&<LandingPage setPage={navigate} isLoggedIn={isLoggedIn} setLoggedIn={setLoggedIn} hasJoinedQuests={hasJoinedQuests}/>}
        {page==="discover"&&<DiscoverPage setPage={navigate} setSelectedQuest={setSelectedQuest} isLoggedIn={isLoggedIn} hasHomeCommunity={hasHomeCommunity} homeCommunity={homeCommunity} onSetupCommunity={()=>setShowCommunitySelector(true)}/>}
        {page==="quest-detail"&&<QuestDetailPage questId={selectedQuest} setPage={navigate} isLoggedIn={isLoggedIn} setLoggedIn={setLoggedIn} onOpenCompletion={()=>setShowCompletion(true)} setSelectedQuestId={setSelectedQuest}/>}
        {page==="my-quests"&&isLoggedIn&&<MyQuestsPage setPage={navigate} onOpenCompletion={()=>setShowCompletion(true)}/>}
        {page==="my-quests"&&!isLoggedIn&&<div className="py-20 px-4"><EmptyState icon={LogIn} title="Sign in to view your quests" desc="Join Kiwimpact free to start tracking your eco quest progress." action="Join Kiwimpact" onAction={()=>setLoggedIn(true)}/></div>}
        {page==="passport"&&isLoggedIn&&<PassportPage setPage={navigate} homeCommunity={homeCommunity}/>}
        {page==="passport"&&!isLoggedIn&&<div className="py-20 px-4"><EmptyState icon={Award} title="Sign in to view your Passport" desc="Your Personal Impact Passport is waiting. Join free." action="Join Kiwimpact" onAction={()=>setLoggedIn(true)}/></div>}
        {page==="leaderboard"&&<LeaderboardPage isLoggedIn={isLoggedIn} homeCommunity={homeCommunity}/>}
        {page==="share-card"&&isLoggedIn&&<ShareCardPage setPage={navigate}/>}
        {page==="share-card"&&!isLoggedIn&&<div className="py-20 px-4"><EmptyState icon={Share2} title="Sign in to build a share card" desc="Complete verified quests to create shareable achievement cards." action="Join Kiwimpact" onAction={()=>setLoggedIn(true)}/></div>}
      </div>

      {isLoggedIn&&<BottomNav page={page} setPage={navigate}/>}

      {showCompletion&&<CompletionModal onClose={()=>setShowCompletion(false)} onSuccess={()=>setShowReward(true)}/>}
      {showReward&&<RewardOverlay onClose={()=>setShowReward(false)} setPage={navigate} reducedMotion={reducedMotion}/>}
      {showCommunitySelector&&<CommunitySelector onSave={c=>setHomeCommunity(c)} onClose={()=>setShowCommunitySelector(false)}/>}
    </div>
  );
}
