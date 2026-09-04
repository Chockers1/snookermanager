import type { AppRoute } from "../types/game";

export const appRoutes: AppRoute[] = [
  { path: "/", label: "Dashboard", section: "Core" },
  { path: "/new-career", label: "New Career", section: "Career" },
  {
    path: "/career/progression",
    label: "Career Progression",
    section: "Career",
  },
  { path: "/career/stats", label: "Legacy Stats", section: "Career" },
  { path: "/player/attributes", label: "Attributes", section: "Player" },
  { path: "/training", label: "Training Planner", section: "Training" },
  { path: "/training/report", label: "Training Report", section: "Training" },
  { path: "/staff/coaches", label: "Coach Market", section: "Staff" },
  { path: "/staff/coaches/:id", label: "Coach Profile", section: "Staff" },
  { path: "/finance", label: "Finance", section: "Finance" },
  { path: "/equipment/cues", label: "Cue Shop", section: "Equipment" },
  {
    path: "/equipment/chalk-tips",
    label: "Chalk & Tips",
    section: "Equipment",
  },
  { path: "/equipment/cases", label: "Cases", section: "Equipment" },
  {
    path: "/equipment/maintenance",
    label: "Maintenance",
    section: "Equipment",
  },
  {
    path: "/equipment/table-setup",
    label: "Training Facility",
    section: "Equipment",
  },
  { path: "/calendar", label: "Calendar", section: "Events" },
  { path: "/travel", label: "Travel Planner", section: "Events" },
  { path: "/tournaments/hub", label: "Tournament Hub", section: "Events" },
  { path: "/tournaments/draw", label: "Tournament Draw", section: "Events" },
  { path: "/match/preview", label: "Match Preview", section: "Match Centre" },
  { path: "/match/live", label: "Live Match", section: "Match Centre" },
  { path: "/match/result", label: "Match Result", section: "Match Centre" },
  { path: "/rankings", label: "Rankings", section: "Rankings" },
  { path: "/sponsorship", label: "Sponsorship", section: "Support" },
  {
    path: "/sponsorship/contract",
    label: "Sponsor Contract",
    section: "Support",
  },
  { path: "/inbox", label: "Inbox", section: "Support" },
  { path: "/mental", label: "Mental State", section: "Support" },
  { path: "/health", label: "Health Centre", section: "Support" },
  { path: "/season-review", label: "Season Review", section: "Support" },
  { path: "/saves", label: "Save Manager", section: "Career" },
];

export const sidebarGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/" },
      { label: "Inbox", path: "/inbox" },
    ],
  },
  {
    title: "Player",
    items: [
      { label: "Attributes", path: "/player/attributes" },
      { label: "Career Progression", path: "/career/progression" },
      { label: "Legacy Stats", path: "/career/stats" },
    ],
  },
  {
    title: "Preparation",
    items: [
      { label: "Training", path: "/training" },
      { label: "Staff", path: "/staff/coaches" },
      { label: "Equipment", path: "/equipment/cues" },
      { label: "Finance", path: "/finance" },
    ],
  },
  {
    title: "Competition",
    items: [
      { label: "Calendar", path: "/calendar" },
      { label: "Tournament Hub", path: "/tournaments/hub" },
      { label: "Match Centre", path: "/match/preview" },
      { label: "Rankings", path: "/rankings" },
    ],
  },
  {
    title: "Career Support",
    items: [
      { label: "Sponsorship", path: "/sponsorship" },
      { label: "Mental", path: "/mental" },
      { label: "Health", path: "/health" },
      { label: "Season Review", path: "/season-review" },
    ],
  },
];
