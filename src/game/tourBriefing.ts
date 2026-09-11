import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';

export type BriefingTour = 'youth' | 'amateur' | 'qTour' | 'qSchool' | 'main' | 'senior' | 'retired';
export type TourBriefingState = { version: 1; tour: BriefingTour; sequence: number };
type Guide = { name: string; overview: string; events: string; ranking: string; goal: string; route: string; types: Tournament['type'][] };
const guides: Record<BriefingTour, Guide> = {
  youth: {
    name: 'Youth circuit',
    overview: 'Build your game through junior competition while balancing training, recovery and affordable travel. Age limits vary by event; youth status does not automatically earn a professional card.',
    events: 'Club leagues offer match practice and may use groups. Regional and national youth events offer stronger competition. Check each event for its age cutoff, format and ranking status.',
    ranking: 'Published youth ranking events award finishing-position points. Prize money and starting seeds are not ranking points; a new season can begin unranked. Non-ranking club results do not change this table.',
    goal: 'Develop and test your game',
    route: 'Aim for consistent regional results, then deeper national runs. As age eligibility changes, the amateur and Q Tour pathways provide further competition. Professional cards must be earned through a specifically advertised qualifying route, such as eligible Q School or a card-awarding championship.',
    types: ['Junior', 'Regional Youth', 'National Youth'],
  },
  amateur: {
    name: 'Amateur circuit',
    overview: 'Build results outside the professional tour. You can compete across eligible amateur and qualifying events; these are overlapping opportunities, not a fixed ladder that every player must complete in order.',
    events: 'Amateur series and championships build experience and standing. Eligible pro-ams offer mixed opposition. Q Tour, Q School and selected international amateur championships offer routes towards a professional card.',
    ranking: 'Amateur ranking events award finishing-position points when their results publish. Prize earnings are separate. A high amateur position or an ordinary tournament win does not itself grant a professional card.',
    goal: 'Earn a professional tour card',
    route: 'Choose a qualification campaign you can afford: build a Q Tour qualification position, reach a Q School card-winning place, or win a championship that explicitly advertises a card. Check the exact award and eligibility before booking; not every amateur champion is promoted.',
    types: ['Amateur', 'Q Tour', 'Q School'],
  },
  qTour: {
    name: 'Q Tour pathway',
    overview: 'Q Tour is an amateur route towards the professional tour. You can still play other eligible amateur events; joining Q Tour is not the same as holding a professional card.',
    events: 'Regional Q Tour events build a qualifying position. The Global Play-Offs are a separate restricted field, not an open event. Regional residence requirements and published selection cutoffs apply.',
    ranking: 'Q Tour standings use the published awards for the relevant circuit. Read the regional table and qualification race together; an empty table means no counting results have published yet. Other amateur and non-ranking events do not add Q Tour credit.',
    goal: 'Reach a card-winning route',
    route: 'The European series has a direct card route for its qualifying leader. Eligible qualifiers from the regional pathways can reach the Global Play-Offs, where section winners earn cards. Q School is an alternative. A good placing or play-off appearance alone is not a card.',
    types: ['Q Tour', 'Q School', 'Amateur'],
  },
  qSchool: {
    name: 'Q School pathway',
    overview: 'Q School is a qualifying campaign for a professional card, not a permanent tour above amateur level. Entering or winning an early match is not promotion. Without a card-winning finish you can continue eligible amateur and Q Tour competition.',
    events: 'Choose an eligible Q School campaign and inspect its events, fee coverage and card-winning round. UK and Asia/Oceania routes have different eligibility and numbers of places. Global Play-Offs require separate qualification.',
    ranking: 'Q School Order of Merit records frames won in counting events. It is separate from the direct card-winning places and from Q Tour standings. A position on this table alone does not confirm a card.',
    goal: 'Secure a qualifying place',
    route: 'Reach one of the advertised card-winning places. Qualification reports will confirm a card award; they are separate from singles trophies. If unsuccessful, use the next amateur or Q Tour campaign to improve and prepare another attempt.',
    types: ['Q School', 'Q Tour', 'Amateur'],
  },
  main: {
    name: 'Main professional tour',
    overview: 'You are on the professional pathway. Your goals are stronger results, access to selected fields and keeping your tour card; there is no higher tour to be promoted into.',
    events: 'Ranking events contribute eligible earnings. Some have qualifying rounds or tiered entry. Invitationals use their own selection rules, and exhibitions are separate. A 16-player field does not always mean the top 16 in the world list.',
    ranking: 'World Ranking uses eligible earnings over two years; the one-year list uses the current season. Players Series events select from the one-year list, while other events use their stated cutoff and criteria. Awards count on publication, and older earnings can expire.',
    goal: 'Compete, qualify and retain your card',
    route: 'Target deeper ranking runs and the relevant selection cutoffs for elite fields. Top 64 at season end is the main card-retention target; remaining card years and other published retention routes also matter. Track defending earnings and the survival race. Invitational money and team trophies do not grant world-ranking credit.',
    types: ['Professional Tour', 'Ranking', 'Major', 'Invitational'],
  },
  senior: {
    name: 'Seniors circuit',
    overview: 'Plan a competitive later career around senior eligibility, recovery and the events you enjoy. The seniors circuit is not an automatic route back to the main tour.',
    events: 'Senior championships and selected invitations have their own age and entry requirements. A veteran-themed exhibition is not necessarily a senior ranking event; check the event details.',
    ranking: 'Only events that explicitly award senior ranking credit count towards the senior table. Prize money, exhibitions and professional world-ranking earnings are separate.',
    goal: 'Build your senior record',
    route: 'Aim for eligible championships and sustainable preparation. If you want to return to professional competition, you still need a valid professional card or the event’s specific invitation or qualifying route.',
    types: ['Senior'],
  },
  retired: {
    name: 'Retirement',
    overview: 'Your competitive career is retired. Keep your career records and review the results, relationships and trophies you built.',
    events: 'The calendar can still describe the wider tour, but retirement does not promise entry to its events.',
    ranking: 'Historical rankings remain career records. Old positions and titles do not create indefinite eligibility for current professional fields.',
    goal: 'Review your career',
    route: 'Use Legacy Stats and player histories to explore past seasons. There is no further promotion objective for a retired career.',
    types: [],
  },
};

export function briefingTour(state: GameState): BriefingTour {
  if (state.careerSystems.lateCareer.retired) return 'retired';
  if (state.careerSystems.lateCareer.seniorActive) return 'senior';
  if (state.careerSystems.pro.hasTourCard || state.player.rankingLabel === 'World Ranking') return 'main';
  // Follow the current competition, not a lifetime achievement or an old Q School campaign.
  if (/youth/i.test(state.player.rankingLabel)) return 'youth';
  if (/q school/i.test(state.player.rankingLabel)) return 'qSchool';
  if (/q tour/i.test(state.player.rankingLabel)) return 'qTour';
  if (/senior/i.test(state.player.rankingLabel)) return 'senior';
  return 'amateur';
}

export function announceTourBriefing(state: GameState): GameState {
  const tour = briefingTour(state);
  const previous = state.tourBriefing;
  // No historical scans or message rebuilding during ordinary play and inbox navigation.
  if (previous?.version === 1 && previous.tour === tour) return state;
  const guide = guides[tour];
  const sequence = (previous?.sequence ?? 0) + 1;
  const upcoming = state.tournaments.filter(event => guide.types.includes(event.type) && event.startDate >= state.currentDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name)).slice(0, 3);
  const summary: NonNullable<InboxMessage['summary']> = [
    { label: 'Your circuit', value: guide.name, detail: guide.overview },
    { label: 'Tournaments to understand', value: 'Formats and entry', detail: guide.events },
    { label: 'How the standings work', value: 'Published results', detail: guide.ranking },
    { label: 'What to work towards', value: guide.goal, detail: guide.route },
  ];
  if (tour === 'main') summary.push({ label: 'Your current card', value: state.careerSystems.pro.hasTourCard ? 'Active' : 'Check retention status', detail: `World Ranking #${state.player.worldRanking}. Review Career Progression for the recorded card term and survival position; this briefing is a snapshot as of ${state.currentDate}.` });
  if (tour !== 'retired') summary.push(
    { label: 'Examples in your calendar', value: upcoming.length ? 'Check entry first' : 'Check the calendar', detail: upcoming.length ? upcoming.map(event => `${event.startDate} · ${event.name}`).join('; ') + '. These are scheduled examples, not confirmed eligibility or bookings.' : 'No upcoming events of this type are listed in the current calendar. Check later dates or the next season’s calendar.' },
    { label: 'Before you book', value: 'Plan within your means', detail: 'Use the tour filter in Calendar. Check entry deadlines, age or regional restrictions, qualification, sponsor clashes and total travel costs. Keep money for weekly commitments and extra hotel nights if you progress. Training and rest weeks are useful too.' },
  );
  const changed = previous && previous.tour !== tour;
  const message: InboxMessage = {
    id: `tour-briefing:${sequence}:${tour}:${state.currentDate}`,
    sender: 'Career Manager', subject: `${changed ? 'Your pathway changed' : 'Your tour explained'} · ${guide.name}`,
    preview: `${state.player.fullName} · As of ${state.currentDate}. ${changed ? `Your current pathway has changed from ${guides[previous.tour].name} to ${guide.name}. ` : ''}Here is how the events, standings and career goals work. This briefing is advice; it requires no response and does not book an event.`,
    date: state.currentDate, priority: 'High', read: false, summary,
    actionLabel: tour === 'retired' ? 'View career records' : 'View tour calendar', actionRoute: tour === 'retired' ? '/career/stats' : '/calendar',
  };
  const inbox = [message, ...state.inbox];
  const unread = Math.min(99, inbox.filter(item => !item.read).length);
  return { ...state, tourBriefing: { version: 1, tour, sequence }, inbox, player: { ...state.player, inboxCount: unread, notificationCount: unread } };
}
