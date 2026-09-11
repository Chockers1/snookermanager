import type { LiveMatchState } from '../../hooks/useGameState';
export type FormEvidence = { openings: number; openingsMade: number; strongLeads: number; leadsLost: number };
export type RecoveryRoute = 'training' | 'coach' | 'protect' | 'patience';
export type FormIssue = { id: string; kind: 'long-pot' | 'closing'; started: string; ends: string; progress: number; route: RecoveryRoute; evidence: string; fatigue: number; confidence: number; lastTraining?: string };
export type LifeStory = { id: string; kind: 'form' | 'staff' | 'junior' | 'return' | 'team'; title: string; created: string; deadline?: string; defaultText: string; steps: { date: string; text: string }[]; resolved?: string; subjectId?: string };
export type StaffRecord = { ambition: 'facilities' | 'progression' | 'methods' | 'pay'; contractKey?: string; end?: string; notice?: { id: string; date: string; deadline: string; reason: string; destination?: string; choice?: 'extend' | 'promise' | 'decline'; quotedWeekly: number }; promise?: { kind: 'facilities' | 'workload'; due: string; met?: boolean }; employer?: string; employedUntil?: string; experience: number; juniorResponsibility?: 'supported'|'specialist'; lastTraining?: string; history: { date: string; text: string }[] };
export type Interview = { id: string; eventId: string; title: string; context: string; opponentId?: string; created: string; deadline: string; response?: 'praise' | 'candid' | 'challenge' | 'private'; answered?: string; reaction?: string };
export type TeamMember = { id: string; name: string; nation: string; profile: LiveMatchState['playerVisitProfile']; confidence: number; fatigue: number; visits: number; pots: number; fouls: number; points: number; highestBreak: number };
export type Team = { name: string; members: [TeamMember, TeamMember] };
export type TeamRubber = { id: string; kind: 'singles' | 'doubles'; home: string[]; away: string[]; score: [number, number]; frames: LiveMatchState['frameHistory']; individuals: TeamMember[] };
export type TeamTie = { home: number; away: number; results: TeamRubber[]; winner?: number };
export type TeamEvent = { id: string; season: string; name: string; kind: 'youth' | 'amateur' | 'nations'; cutoff: string; start: string; end: string; deadline: string; status: 'invited' | 'accepted' | 'declined' | 'withdrawn' | 'completed'; accepted?: string; teams: Team[]; partnerOptions: TeamMember[]; ties: TeamTie[]; fee: number; travel: number; support: number; winnerShare: number; runnerUpShare: number; award?: number; settled?: boolean; champion?: string; playerAwards?: Record<string,number> };
export type TeamContext = { eventId: string; tie: number; rubber: number; kind: 'singles' | 'doubles'; members: TeamMember[]; order: number[]; turn: number; coordination: number; foulReplayTurn?: number };
export type SeasonLifeState = { version: 1; initialized: string; checkedDate: string; matchCursor?: string; evidence: (FormEvidence & { id: string; date: string })[]; form?: FormIssue; formCooldown?: string; staff: Record<string, StaffRecord>; interviews: Interview[]; stories: LifeStory[]; archivedStories?: {id:string;title:string;date:string;text:string}[]; partnerships: Record<string, { trust: number; familiarity: number; matches: number }>; teams: TeamEvent[]; archivedTeams?: {id:string;season:string;name:string;champion?:string;won:boolean;award:number;results:string[]}[]; offeredSeason?: string; nextTeamOfferDate?: string; injuredRivals: string[]; expectationsUntil?: string; televisedBreakthroughSeen?: boolean; mediaPersonalities?: Record<string, 'reserved'|'competitive'|'gracious'>; summaries: { season: string; text: string }[]; season: string };
export type SeasonLifeAction =
 | { type: 'life-recovery'; route: RecoveryRoute }
 | { type: 'life-staff'; id: string; choice: 'extend' | 'facilities' | 'workload' | 'decline' }
 | { type: 'life-interview'; id: string; response: NonNullable<Interview['response']> }
 | { type: 'life-team'; id: string; choice: 'accept' | 'decline' | 'withdraw'; partnerId?: string }
 | { type: 'life-play-team'; id: string }
 | { type: 'life-return'; id: string }
 | { type: 'life-foul-replay' }
 | { type: 'life-junior-review'; id: string; choice: 'supported'|'specialist' };
