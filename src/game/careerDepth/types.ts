export type ProjectKind = 'long-pot' | 'safety' | 'cue-action' | 'stamina' | 'pressure';
export type Strategy = 'ranking' | 'majors' | 'development' | 'survival';
export type CommitmentKind = 'exhibition' | 'camp' | 'appearance' | 'recovery' | 'club-work';
export type StoryKind = 'deciders' | 'breakthrough' | 'early-exits' | 'television';
export type StoryChoice = 'programme' | 'support' | 'continue' | 'exhibition' | 'sponsor' | 'protect' | 'technique' | 'coach' | 'media' | 'coach-prep';
export type CareerStory = {
  id: string; kind: StoryKind; title: string; evidence: string;
  createdDate: string; expiresDate: string; resolvedDate?: string;
  choice?: StoryChoice; reviewDate?: string; reviewed?: boolean;
  updates: string[]; status: 'pending' | 'resolved' | 'expired';
  matchCount: number; trainingWeeks: number;
  resolvedMatchIds?: string[];
};
export type DevelopmentProject = {
  id: string; kind: ProjectKind; startedDate: string; reviewDate: string;
  completedWeeks: number; lastWeek?: string; status: 'active' | 'completed' | 'cancelled';
  note: string; baseline: Record<string, number>; evidenceMatches: number;
  closingAttributes?: Record<string, number>;
  matchEvidence?: { matches: number; pottingTotal: number; safetyTotal: number; highestBreak: number; longMatches: number; longMatchWins: number };
};
export type OpponentRelationship = {
  draws?: number; closeMatches?: number; finals?: number; intensity?: number;
  meetings?: { id: string; date: string; event: string; round: string; score: string; result: string }[];
  opponentId: string; name: string; wins: number; losses: number; deciders: number;
  rivalry: boolean; recent: ('W' | 'L')[];
  tactics: Record<string, number>;
};
export type CareerCommitment = {
  id: string; kind: CommitmentKind; startDate: string; endDate: string;
  cost: number; income: number; fatigue: number; sharpness: number;
  status: 'scheduled' | 'completed' | 'cancelled'; sourceStoryId?: string;
  sponsorId?: string;
};
export type ApprovedSchedule = {
  strategy: Strategy; targets: string[]; eventIds: string[];
  approvedDate: string; expiresDate: string; cap: number; reserve: number;
  spent: number; completedEventIds: string[]; enabled: boolean; pauseReason?: string;
  quotes: Record<string, number>; recurringCost: number;
};
export type CareerDepthState = {
  board?: import("../seasonBoard").SeasonBoard;
  achievements?: import("../careerAchievements").Achievement[];
  entryReminders?: string[];
  objectiveRecord?: { achieved: number; total: number; matches: number };
  version: 1; seenMatchIds: string[]; seenEventIds: string[];
  milestones: string[]; lastStoryDate?: string; stories: CareerStory[];
  relationships: Record<string, OpponentRelationship>;
  coachRelationships: Record<string, { trust: number; lastWeek?: string; lastReviewDate?: string; note: string }>;
  partnerId: string | null; project: DevelopmentProject | null;
  partnerFocus?: string;
  practiceHistory?: Record<string, { sessions: number; lastDate: string; skill: string }>;
  commercialIntroduction?: { offerId: string; expiresDate: string; used: boolean };
  mediaExpectationsUntil?: string;
  projectHistory: DevelopmentProject[]; trainingWeeks: number;
  commitments: CareerCommitment[]; schedule: ApprovedSchedule | null;
  strategy: Strategy; targets: string[]; nextSettlementDate: string;
  temporarySharpness: number; sharpnessExpires?: string;
};
export type CareerDepthAction =
  | { type: 'priority-event'; id: string }
  | { type: 'season-block'; start: string; kind: 'training' | 'rest'; focus: ProjectKind }
  | { type: 'remove-season-block'; id: string }
  | { type: 'project'; kind: ProjectKind }
  | { type: 'cancel-project' }
  | { type: 'partner'; id: string | null }
  | { type: 'partner-focus'; skill: string }
  | { type: 'coach-review'; id: string }
  | { type: 'decision'; id: string; choice: StoryChoice }
  | { type: 'commitment'; kind: CommitmentKind; startDate: string }
  | { type: 'cancel-commitment'; id: string }
  | { type: 'strategy'; strategy: Strategy; targets: string[] }
  | { type: 'approve-schedule'; eventIds: string[]; cap: number; reserve: number }
  | { type: 'pause-schedule' }
  | { type: 'run-assistance' };
