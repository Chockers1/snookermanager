import type {
  Player,
  PlayerAttributes,
  TrainingCell,
  TrainingPlannerDay,
  TrainingPlannerSummary,
} from "../types/game";

export type TrainingSessionKey = "morning" | "afternoon" | "evening";

export type TrainingSessionOption = {
  id: string;
  title: string;
  subtitle: string;
  category: TrainingCell["category"];
  load: number;
};

export type CompetitionCommitment = {
  name: string;
  location: string;
  startDate: string;
};

export type TrainingFocusPresetId =
  | "balanced"
  | "potting"
  | "safety"
  | "match-ready"
  | "mental"
  | "fitness"
  | "recovery";

export type TrainingFocusPreset = {
  id: TrainingFocusPresetId;
  label: string;
  description: string;
  outcome: string;
};

export const TRAINING_FOCUS_PRESETS: TrainingFocusPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Steady development across the whole game.",
    outcome: "Balanced growth",
  },
  {
    id: "potting",
    label: "Potting & Scoring",
    description: "Prioritise cueing, long pots and break construction.",
    outcome: "Scoring skills",
  },
  {
    id: "safety",
    label: "Safety & Tactical",
    description: "Build cue-ball control, patience and match craft.",
    outcome: "Tactical control",
  },
  {
    id: "match-ready",
    label: "Match Ready",
    description: "Protect sharpness and confidence before competition.",
    outcome: "Event readiness",
  },
  {
    id: "mental",
    label: "Mental",
    description: "Strengthen routine, focus and pressure management.",
    outcome: "Mental resilience",
  },
  {
    id: "fitness",
    label: "Fitness",
    description: "Improve stamina without abandoning table time.",
    outcome: "Physical base",
  },
  {
    id: "recovery",
    label: "Recovery",
    description: "Reduce fatigue and strain with a deliberately light week.",
    outcome: "Freshness",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function daysUntil(dateString: string, currentDate: string) {
  const target = new Date(`${dateString}T00:00:00`).getTime();
  const current = new Date(`${currentDate}T00:00:00`).getTime();
  return Math.round((target - current) / (1000 * 60 * 60 * 24));
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return {
    day: date.toLocaleDateString("en-GB", { weekday: "short" }),
    dateLabel: `${date.getDate()} ${date.toLocaleDateString("en-GB", { month: "short" })}`,
  };
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const TRAINING_SESSION_OPTIONS: TrainingSessionOption[] = [
  {
    id: "line-up-drill",
    title: "Line-Up Drill",
    subtitle: "Potting accuracy",
    category: "Technical",
    load: 36,
  },
  {
    id: "long-pot-routine",
    title: "Long Pot Routine",
    subtitle: "Range and timing",
    category: "Technical",
    load: 34,
  },
  {
    id: "safety-exchanges",
    title: "Safety Exchanges",
    subtitle: "Cue-ball control",
    category: "Technical",
    load: 28,
  },
  {
    id: "break-building",
    title: "Break Building",
    subtitle: "Pattern play",
    category: "Technical",
    load: 30,
  },
  {
    id: "mental-training",
    title: "Mental Training",
    subtitle: "Routine and focus",
    category: "Mental",
    load: 18,
  },
  {
    id: "video-review",
    title: "Review",
    subtitle: "Notes and reset",
    category: "Mental",
    load: 12,
  },
  {
    id: "fitness",
    title: "Fitness",
    subtitle: "Strength and conditioning",
    category: "Physical",
    load: 26,
  },
  {
    id: "match-prep",
    title: "Match Prep",
    subtitle: "Light table session",
    category: "Match Prep",
    load: 20,
  },
  {
    id: "match-simulation",
    title: "Match Simulation",
    subtitle: "Competitive rehearsal",
    category: "Match Prep",
    load: 24,
  },
  {
    id: "recovery",
    title: "Recovery",
    subtitle: "Mobility and stretch",
    category: "Recovery",
    load: 10,
  },
  {
    id: "travel",
    title: "Travel",
    subtitle: "Journey to event",
    category: "Travel",
    load: 8,
  },
  {
    id: "rest",
    title: "Rest",
    subtitle: "Low-load recovery block",
    category: "Rest",
    load: 4,
  },
];

const TRAINING_OPTIONS_BY_ID = new Map(
  TRAINING_SESSION_OPTIONS.map((option) => [option.id, option]),
);

export function getTrainingSessionOption(optionId: string) {
  return (
    TRAINING_OPTIONS_BY_ID.get(optionId) ??
    TRAINING_OPTIONS_BY_ID.get("recovery")!
  );
}

export function buildTrainingCell(optionId: string): TrainingCell {
  const option = getTrainingSessionOption(optionId);

  return {
    title: option.title,
    subtitle: option.subtitle,
    category: option.category,
  };
}

export function getTrainingSessionOptionId(cell: TrainingCell) {
  const matchedOption = TRAINING_SESSION_OPTIONS.find(
    (option) =>
      option.title === cell.title && option.category === cell.category,
  );
  return matchedOption?.id ?? "recovery";
}

function calculateDayLoad(
  day: Pick<TrainingPlannerDay, "morning" | "afternoon" | "evening">,
) {
  const sessionLoad = [day.morning, day.afternoon, day.evening]
    .map(
      (session) =>
        getTrainingSessionOption(getTrainingSessionOptionId(session)).load,
    )
    .reduce((sum, value) => sum + value, 0);

  return clamp(Math.round(sessionLoad / 1.1), 18, 92);
}

function getLoadLabel(load: number) {
  if (load >= 80) return "High";
  if (load >= 55) return "Medium";
  return "Low";
}

function findCompetitionForDate(
  dateString: string,
  competitions: CompetitionCommitment[],
) {
  return (
    competitions.find((competition) => competition.startDate === dateString) ??
    null
  );
}

function createPlannerDay(
  dateString: string,
  morningId: string,
  afternoonId: string,
  eveningId: string,
  competitions: CompetitionCommitment[],
) {
  const labels = formatDateLabel(dateString);
  const competition = findCompetitionForDate(dateString, competitions);
  const day: TrainingPlannerDay = {
    ...labels,
    morning: buildTrainingCell(morningId),
    afternoon: buildTrainingCell(afternoonId),
    evening: buildTrainingCell(eveningId),
    competitionName: competition?.name,
    competitionLocation: competition?.location,
    load: 0,
    loadLabel: "Low",
  };

  const load = calculateDayLoad(day);

  return {
    ...day,
    load,
    loadLabel: getLoadLabel(load),
  };
}

export function cloneTrainingPlan(week: TrainingPlannerDay[]) {
  return week.map((day) => ({
    ...day,
    morning: { ...day.morning },
    afternoon: { ...day.afternoon },
    evening: { ...day.evening },
  }));
}

export function buildAutoTrainingPlan(
  currentDate: string,
  fatigue: number,
  competitions: CompetitionCommitment[] = [],
  travelBooked = false,
) {
  const nearestCompetitionDaysAway =
    competitions.length > 0
      ? Math.min(
          ...competitions
            .map((competition) => daysUntil(competition.startDate, currentDate))
            .filter((value) => value >= 0),
        )
      : null;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${currentDate}T00:00:00`);
    date.setDate(date.getDate() + index);
    const dateString = formatLocalDate(date);
    const heavyDay = index < 3 && fatigue < 65;
    const nearCompetition =
      nearestCompetitionDaysAway !== null &&
      index >= Math.max(0, nearestCompetitionDaysAway - 2);
    const travelDay =
      travelBooked &&
      nearestCompetitionDaysAway !== null &&
      index === Math.max(0, nearestCompetitionDaysAway - 1);
    const competitionDay =
      nearestCompetitionDaysAway !== null &&
      index === nearestCompetitionDaysAway;

    if (competitionDay) {
      return createPlannerDay(
        dateString,
        "match-prep",
        "match-simulation",
        "rest",
        competitions,
      );
    }

    if (travelDay) {
      return createPlannerDay(
        dateString,
        "recovery",
        "travel",
        "video-review",
        competitions,
      );
    }

    if (nearCompetition) {
      return createPlannerDay(
        dateString,
        "mental-training",
        "match-prep",
        "rest",
        competitions,
      );
    }

    if (!heavyDay) {
      return createPlannerDay(
        dateString,
        "recovery",
        index % 2 === 0 ? "mental-training" : "break-building",
        "rest",
        competitions,
      );
    }

    if (index % 2 === 0) {
      return createPlannerDay(
        dateString,
        "line-up-drill",
        "long-pot-routine",
        "fitness",
        competitions,
      );
    }

    return createPlannerDay(
      dateString,
      "safety-exchanges",
      "break-building",
      "mental-training",
      competitions,
    );
  });
}

export function buildRecoveryTrainingPlan(
  currentDate: string,
  competitions: CompetitionCommitment[] = [],
) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${currentDate}T00:00:00`);
    date.setDate(date.getDate() + index);
    const dateString = formatLocalDate(date);
    return createPlannerDay(
      dateString,
      "recovery",
      "rest",
      "rest",
      competitions,
    );
  });
}

export function normalizeTrainingPlan(
  week: TrainingPlannerDay[],
  currentDate: string,
  competitions: CompetitionCommitment[] = [],
) {
  if (week.length !== 7) {
    return buildAutoTrainingPlan(currentDate, 35, competitions);
  }

  return week.map((day, index) => {
    const date = new Date(`${currentDate}T00:00:00`);
    date.setDate(date.getDate() + index);
    const dateString = formatLocalDate(date);
    const labels = formatDateLabel(dateString);
    const competition = findCompetitionForDate(dateString, competitions);
    const normalizedDay: TrainingPlannerDay = {
      ...day,
      ...labels,
      morning: buildTrainingCell(getTrainingSessionOptionId(day.morning)),
      afternoon: buildTrainingCell(getTrainingSessionOptionId(day.afternoon)),
      evening: buildTrainingCell(getTrainingSessionOptionId(day.evening)),
      competitionName: competition?.name,
      competitionLocation: competition?.location,
      load: 0,
      loadLabel: "Low",
    };
    const load = calculateDayLoad(normalizedDay);
    return {
      ...normalizedDay,
      load,
      loadLabel: getLoadLabel(load),
    };
  });
}

export function summarizeTrainingPlan(
  week: TrainingPlannerDay[],
  player: Pick<Player, "fatigue" | "confidence">,
  attributes: PlayerAttributes,
  coachCompatibility = 0,
): TrainingPlannerSummary {
  const normalizedWeek = week.map((day) => {
    const load = calculateDayLoad(day);
    return {
      ...day,
      load,
      loadLabel: getLoadLabel(load),
    };
  });
  const sessions = normalizedWeek.flatMap((day) => [
    day.morning,
    day.afternoon,
    day.evening,
  ]);
  const technicalSessions = sessions.filter(
    (session) => session.category === "Technical",
  ).length;
  const mentalSessions = sessions.filter(
    (session) => session.category === "Mental",
  ).length;
  const physicalSessions = sessions.filter(
    (session) => session.category === "Physical",
  ).length;
  const matchPrepSessions = sessions.filter(
    (session) => session.category === "Match Prep",
  ).length;
  const recoverySessions = sessions.filter(
    (session) => session.category === "Recovery",
  ).length;
  const restSessions = sessions.filter(
    (session) => session.category === "Rest",
  ).length;
  const travelSessions = sessions.filter(
    (session) => session.category === "Travel",
  ).length;
  const totalSessions = sessions.length;
  const weekLoad = average(normalizedWeek.map((day) => day.load));
  const fatigueTrend = clamp(
    Math.round(
      (weekLoad +
        physicalSessions * 3 +
        technicalSessions * 2 -
        recoverySessions * 5 -
        restSessions * 7) /
        10,
    ),
    -18,
    18,
  );
  const fatigueRisk = clamp(
    Math.round(
      (player.fatigue + weekLoad - recoverySessions * 2 - restSessions * 3) / 2,
    ),
    8,
    95,
  );
  const confidenceProjection = clamp(
    Math.round((mentalSessions + matchPrepSessions + recoverySessions) / 2),
    1,
    12,
  );

  return {
    weekLoad,
    weekLoadLabel: getLoadLabel(weekLoad),
    fatigueRisk,
    fatigueTrend,
    expectedGains: [
      {
        label: "Long Potting",
        value: Math.max(
          1,
          Math.round(
            (technicalSessions + attributes.technical["Long Potting"] / 25) / 2,
          ),
        ),
      },
      {
        label: "Safety Play",
        value: Math.max(
          1,
          Math.round(
            (technicalSessions +
              recoverySessions +
              attributes.technical["Safety Play"] / 28) /
              3,
          ),
        ),
      },
      {
        label: "Focus",
        value: Math.max(
          1,
          Math.round(
            (mentalSessions + recoverySessions + matchPrepSessions) / 2,
          ),
        ),
      },
      {
        label: "Stamina",
        value: Math.max(
          1,
          Math.round(
            (physicalSessions +
              recoverySessions +
              attributes.physical.Stamina / 30) /
              2,
          ),
        ),
      },
    ],
    coachImpact: Math.round(coachCompatibility / 8),
    confidenceProjection,
    confidenceLabel: `${clamp(player.confidence + confidenceProjection, 0, 100)}% projected`,
    balance: [
      {
        label: "Technical",
        value: Math.round((technicalSessions / totalSessions) * 100),
        sessions: technicalSessions,
        tone: "green",
      },
      {
        label: "Mental",
        value: Math.round((mentalSessions / totalSessions) * 100),
        sessions: mentalSessions,
        tone: "violet",
      },
      {
        label: "Physical",
        value: Math.round((physicalSessions / totalSessions) * 100),
        sessions: physicalSessions,
        tone: "blue",
      },
      {
        label: "Match Prep",
        value: Math.round((matchPrepSessions / totalSessions) * 100),
        sessions: matchPrepSessions,
        tone: "gold",
      },
    ],
    totalSessions,
    averageIntensity:
      weekLoad >= 75 ? "Medium-High" : weekLoad >= 55 ? "Balanced" : "Light",
    restSessions: restSessions + recoverySessions,
    travelSessions,
  };
}

export function calculateTrainingEffects(week: TrainingPlannerDay[]) {
  const sessions = week.flatMap((day) => [
    day.morning,
    day.afternoon,
    day.evening,
  ]);
  const technicalSessions = sessions.filter(
    (session) => session.category === "Technical",
  ).length;
  const mentalSessions = sessions.filter(
    (session) => session.category === "Mental",
  ).length;
  const physicalSessions = sessions.filter(
    (session) => session.category === "Physical",
  ).length;
  const matchPrepSessions = sessions.filter(
    (session) => session.category === "Match Prep",
  ).length;
  const recoverySessions = sessions.filter(
    (session) => session.category === "Recovery",
  ).length;
  const restSessions = sessions.filter(
    (session) => session.category === "Rest",
  ).length;
  const travelSessions = sessions.filter(
    (session) => session.category === "Travel",
  ).length;
  const weekLoad =
    technicalSessions * 8 +
    physicalSessions * 10 +
    matchPrepSessions * 8 +
    mentalSessions * 6 +
    travelSessions * 3 -
    recoverySessions * 7 -
    restSessions * 9;
  const highIntensitySessions = sessions.filter((session) =>
    ["Technical", "Physical", "Match Prep"].includes(session.category),
  ).length;

  return {
    fatigueDelta: clamp(
      technicalSessions * 2 +
        physicalSessions * 3 +
        matchPrepSessions * 2 +
        mentalSessions -
        recoverySessions * 3 -
        restSessions * 4 -
        travelSessions,
      -18,
      14,
    ),
    confidenceDelta: clamp(
      Math.round(
        (mentalSessions + matchPrepSessions + recoverySessions - restSessions) /
          2,
      ),
      -2,
      6,
    ),
    moraleDelta: clamp(
      Math.round(
        (restSessions + recoverySessions + mentalSessions - physicalSessions) /
          2,
      ),
      -3,
      5,
    ),
    technicalGain: Math.max(
      0,
      Math.round((technicalSessions + matchPrepSessions) / 2),
    ),
    cueControlGain: Math.max(0, Math.round(technicalSessions / 3)),
    breakBuildingGain: Math.max(
      0,
      Math.round((technicalSessions + matchPrepSessions) / 3),
    ),
    focusGain: Math.max(
      0,
      Math.round((mentalSessions + matchPrepSessions) / 2),
    ),
    staminaGain: Math.max(0, Math.round(physicalSessions / 2)),
    restSessions,
    recoverySessions,
    weekLoad: Math.max(0, weekLoad),
    highIntensitySessions,
  };
}

const FOCUS_TEMPLATES: Record<
  Exclude<TrainingFocusPresetId, "balanced" | "recovery">,
  [string, string, string][]
> = {
  potting: [
    ["line-up-drill", "break-building", "mental-training"],
    ["long-pot-routine", "break-building", "rest"],
    ["line-up-drill", "long-pot-routine", "fitness"],
    ["break-building", "match-simulation", "recovery"],
    ["long-pot-routine", "break-building", "mental-training"],
    ["match-prep", "video-review", "rest"],
    ["recovery", "rest", "rest"],
  ],
  safety: [
    ["safety-exchanges", "video-review", "mental-training"],
    ["safety-exchanges", "match-simulation", "rest"],
    ["line-up-drill", "safety-exchanges", "fitness"],
    ["safety-exchanges", "match-prep", "recovery"],
    ["break-building", "safety-exchanges", "mental-training"],
    ["match-simulation", "video-review", "rest"],
    ["recovery", "rest", "rest"],
  ],
  "match-ready": [
    ["match-prep", "match-simulation", "mental-training"],
    ["line-up-drill", "match-prep", "recovery"],
    ["safety-exchanges", "match-simulation", "rest"],
    ["break-building", "match-prep", "mental-training"],
    ["recovery", "video-review", "rest"],
    ["match-prep", "mental-training", "rest"],
    ["recovery", "rest", "rest"],
  ],
  mental: [
    ["mental-training", "video-review", "rest"],
    ["line-up-drill", "mental-training", "recovery"],
    ["mental-training", "match-simulation", "rest"],
    ["safety-exchanges", "video-review", "mental-training"],
    ["match-prep", "mental-training", "recovery"],
    ["video-review", "mental-training", "rest"],
    ["recovery", "rest", "rest"],
  ],
  fitness: [
    ["fitness", "line-up-drill", "recovery"],
    ["fitness", "safety-exchanges", "rest"],
    ["line-up-drill", "fitness", "mental-training"],
    ["fitness", "break-building", "recovery"],
    ["long-pot-routine", "fitness", "rest"],
    ["match-prep", "recovery", "rest"],
    ["recovery", "rest", "rest"],
  ],
};

export function buildFocusedTrainingPlan(
  focusId: TrainingFocusPresetId,
  currentDate: string,
  fatigue: number,
  competitions: CompetitionCommitment[] = [],
  travelBooked = false,
) {
  if (focusId === "balanced")
    return buildAutoTrainingPlan(
      currentDate,
      fatigue,
      competitions,
      travelBooked,
    );
  const baseline =
    focusId === "recovery"
      ? buildRecoveryTrainingPlan(currentDate, competitions)
      : FOCUS_TEMPLATES[focusId].map((sessions, index) => {
          const date = new Date(`${currentDate}T00:00:00`);
          date.setDate(date.getDate() + index);
          return createPlannerDay(
            formatLocalDate(date),
            sessions[0],
            sessions[1],
            sessions[2],
            competitions,
          );
        });

  const protectedPlan = buildAutoTrainingPlan(
    currentDate,
    fatigue,
    competitions,
    travelBooked,
  );
  return baseline.map((day, index) => {
    const protectedDay = protectedPlan[index];
    const hasCommitment =
      Boolean(protectedDay.competitionName) ||
      getTrainingSessionOptionId(protectedDay.afternoon) === "travel";
    const nearEvent =
      index > 0 &&
      protectedPlan
        .slice(index, index + 3)
        .some((candidate) => candidate.competitionName);
    return hasCommitment || nearEvent ? protectedDay : day;
  });
}
