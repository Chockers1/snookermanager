import { indexedEvents } from './resultIndex';
import type { GameState } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { qualifiedNames } from './rollingRankings';

export type PathwayRegion = 'Europe' | 'Asia Pacific' | 'Middle East' | 'Americas' | 'Africa';
const nations: Record<PathwayRegion, string[]> = {
  Europe: 'ENG SCO WAL NIR IRL GBR FRA GER DEU ESP POR ITA BEL NED NLD AUT SUI CHE POL CZE SVK HUN ROU BUL BGR UKR MDA SRB CRO HRV BIH SVN MNE MKD ALB GRE GRC CYP TUR EST LAT LVA LTU FIN SWE NOR DEN DNK ISL MLT GEO ARM AZE RUS BLR'.split(' '),
  'Asia Pacific': 'CHN HKG MAC TPE TWN JPN KOR PRK MNG IND PAK BAN BGD SRI LKA NEP NPL BHU BTN THA VIE VNM CAM KHM LAO MYA MMR MAS MYS SIN SGP INA IDN PHI PHL BRU BRN TLS AFG KAZ UZB TJK KGZ TKM AUS NZL FIJ PNG SAM WSM TON VAN VUT SOL SLB KIR TUV NRU PLW FSM MHL COK'.split(' '),
  'Middle East': 'IRN IRQ UAE ARE KSA SAU QAT KUW KWT BHR OMA OMN YEM JOR LIB LBN SYR ISR PLE PSE'.split(' '),
  Americas: 'USA CAN MEX BRA ARG CHI CHL COL PER ECU BOL PAR PRY URU URY VEN GUY SUR CRC PAN GUA GTM HON HND SLV NIC BLZ CUB JAM HAI HTI DOM PUR TTO BAH BHS BAR BRB GRN LCA VCT ATG DMA SKN KNA'.split(' '),
  Africa: 'RSA ZAF EGY MAR ALG DZA TUN LBA LBY SUD SDN SSD ETH ERI DJI SOM KEN UGA TAN TZA RWA BDI COD COG CAF GAB CMR NGA GHA CIV SEN GMB GIN GNB SLE LBR MLI BFA NER TCD BEN TOG CPV STP GNQ ANG AGO ZAM ZMB ZIM ZWE BOT BWA NAM MOZ MDG MRI MUS SEY SYC COM MAW MWI LES LSO SWZ MRT'.split(' '),
};
export function nationRegion(nation: string): PathwayRegion | undefined {
  return (Object.keys(nations) as PathwayRegion[]).find(r => nations[r].includes(nation.toUpperCase()));
}
export function qTourRegion(t: Pick<Tournament, 'name' | 'tourCircuit'> & Partial<Pick<Tournament, 'type'>>): PathwayRegion | undefined {
  const text = t.tourCircuit + ' ' + t.name;
  if (t.type && t.type !== 'Q Tour' || /play.off|q school|federation/i.test(text)) return undefined;
  if (!t.type && !/q tour/i.test(text) && !/^(Europe|Asia Pacific|Middle East|Americas)\s*-\s*Event\s+\d+/i.test(t.name)) return undefined;
  return (['Asia Pacific', 'Middle East', 'Americas', 'Europe'] as PathwayRegion[]).find(r => text.toLowerCase().includes(r.toLowerCase()));
}
export function pathwayAgeLimit(t: Pick<Tournament, 'name' | 'type'>) {
  if (/under[ -]?16|\bu16\b/i.test(t.name)) return 16;
  if (/under[ -]?18|\bu18\b/i.test(t.name)) return 18;
  if (/wsf junior/i.test(t.name)) return 19;
  if (/under[ -]?21|\bu21\b/i.test(t.name)) return 21;
  return ['Junior', 'Regional Youth', 'National Youth'].includes(t.type) ? 21 : undefined;
}
export function ageAtDate(age: number, birth: string | undefined, date: string) {
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return age;
  return Number(date.slice(0, 4)) - Number(birth.slice(0, 4)) - (date.slice(5) < birth.slice(5) ? 1 : 0);
}
export function pathwayAgeDate(t: Tournament) {
  return /ebsa/i.test(t.name) ? t.startDate.slice(0, 4) + '-03-31' : t.startDate;
}
export function residenceRegion(home: string): PathwayRegion {
  if (/sydney|perth|brisbane|albury|auckland|new.?zealand|beijing|shanghai|bangkok|hongkong|wuhan|yushan|xi'an/i.test(home)) return 'Asia Pacific';
  if (/dubai|abu dhabi|riyadh|jeddah/i.test(home)) return 'Middle East';
  if (/toronto|san.?jose|rio|sao paulo|americas/i.test(home)) return 'Americas';
  if (/africa|cairo|johannesburg/i.test(home)) return 'Africa';
  return 'Europe';
}
export type PathwayEntrant = { name: string; nation: string; age: number; dateOfBirth?: string; hasTourCard: boolean; retired?: boolean; residence?: PathwayRegion; residentSince?: string };
type AccessState = Partial<Pick<GameState, 'rollingRankings' | 'season' | 'history' | 'tournaments'>> & { securedCards?: ReadonlySet<string> };
export function securedPathwayCards(state: AccessState, before: string, includeAutomatic = true) {
  return new Set(recordedCardAwards(state, before, includeAutomatic).keys());
}
export function pathwayEntryReason(t: Tournament, p: PathwayEntrant, state: AccessState = {}): string | null {
  if (p.retired) return 'This player is retired.';
  const limit = pathwayAgeLimit(t);
  const age = ageAtDate(p.age, p.dateOfBirth, pathwayAgeDate(t));
  if (limit && age >= limit) return 'Requires age under ' + limit + ' on ' + pathwayAgeDate(t) + '.';
  const offTour = ['Junior', 'Regional Youth', 'National Youth', 'Amateur', 'Q Tour', 'Q School'].includes(t.type);
  if (offTour && !/pro.am/i.test(t.name) && p.hasTourCard) return 'This pathway requires an off-tour player.';
  if (t.type === 'Senior' && ageAtDate(p.age, p.dateOfBirth, t.startDate) < 40) return 'Senior events require age 40+; active professionals are eligible.';
  const region = nationRegion(p.nation);
  if (t.type === 'Q School') {
    if (/asia[ -]*oceania/i.test(t.name) && !['Asia Pacific', 'Middle East'].includes(region ?? '')) return 'Asia-Oceania Q School requires citizenship of an Asian or Oceanian country.';
    if ((state.securedCards ?? securedPathwayCards(state, t.startDate)).has(p.name)) return 'A next-season tour card has already been secured; qualified players leave Q School.';
  }
  if (/ebsa/i.test(t.name) && region !== 'Europe') return 'EBSA championships require representation of a European member federation.';
  if (t.type === 'Q Tour') {
    const eventRegion = qTourRegion(t);
    if (eventRegion && eventRegion !== 'Europe') {
      // Residence is separate from a journey. Changing training base starts a new six-month period.
      const residence = p.residence ?? region;
      const cutoff = new Date(t.startDate + 'T12:00:00Z'); cutoff.setUTCMonth(cutoff.getUTCMonth() - 6);
      if (residence !== eventRegion || p.residentSince && p.residentSince > cutoff.toISOString().slice(0, 10)) return 'Regional Q Tour requires six months of residence in ' + eventRegion + '.';
    }
  }
  if (/cbsa/i.test(t.name) && p.nation !== 'CHN') return 'Requires selection through the Chinese federation pathway.';
  if (t.type === 'Amateur' && /federation/i.test(t.name)) {
    const required = /africa/i.test(t.name) ? 'Africa' : /americas|pan.american/i.test(t.name) ? 'Americas' : /asia.pacific/i.test(t.name) ? 'Asia Pacific' : undefined;
    if (required && region !== required) return 'Requires nomination by a member federation in ' + required + '.';
  }
  return null;
}

export function pathwayPlacementPrize(t: Tournament, round: string, champion: boolean): number | undefined {
  if (t.type === 'Q School') return 0;
  if (t.type === 'Q Tour' && qTourRegion(t) === 'Europe') return champion ? 6000 : ({ Final: 3000, 'Semi Final': 2000, 'Quarter Final': 1250, 'Last 16': 750, 'Last 32': 350 } as Record<string, number>)[round] ?? 0;
  if (/seniors tour\s*-\s*event/i.test(t.name)) return champion ? 1000 : ({ Final: 500, 'Semi Final': 250, 'Quarter Final': 125, 'Last 16': 62.5 } as Record<string, number>)[round] ?? 0;
  return undefined;
}

export const Q_TOUR_POINTS: Record<string, number> = { Winner: 10000, Final: 7000, 'Semi Final': 4900, 'Quarter Final': 3430, 'Last 16': 2400, 'Last 32': 1680, 'Last 64': 1175, 'Last 128': 825, 'Preliminary Rounds': 575 };
/** Use the same dated awards for eligibility and rollover, including EBSA runner-up places. */
function recordedCardAwards(state: AccessState, before: string, includeAutomatic = false) {
  const awards = new Map<string, 'Q School' | 'Q Tour' | 'Federation Route'>();
  const events = indexedEvents(state.rollingRankings, state.season).filter(e => e.completedOn <= before);
  const automaticDate = includeAutomatic && state.season ? events.find(e => /^Europe - Event 7$/i.test(e.name))?.completedOn : undefined;
  // Qualification reads explicit awards only, preventing recursion through the automatic place.
  const automatic = automaticDate && state.season ? qTourQualification({...state,season:state.season},automaticDate).automatic : undefined;
  const awardAutomatic = () => { if (automatic && !awards.has(automatic)) awards.set(automatic, 'Q Tour'); };
  for (const e of events) {
    if (automaticDate && e.completedOn > automaticDate) awardAutomatic();
    const event = state.tournaments?.find(t => t.id === e.tournamentId);
    const amateurCard = event ? event.type === 'Amateur' && /tour card/i.test(event.reward ?? '') : /wsf.*championship|ebsa.*(u21|amateur)|federation.*(route|qualifier)/i.test(e.name);
    const source = /q school/i.test(e.name) && !/review/i.test(e.name) ? 'Q School' : /q tour.*play.off/i.test(e.name) ? 'Q Tour' : amateurCard ? 'Federation Route' : undefined;
    if (!source) continue;
    for (const winner of qualifiedNames(e.bracket)) {
      if (!awards.has(winner)) awards.set(winner, source);
      else if (source === 'Federation Route' && /ebsa/i.test(e.name)) {
        const final = e.bracket.at(-1)?.matches[0];
        const runner = final && [final.top.name, final.bottom.name].find(n => n !== winner);
        if (runner && !awards.has(runner)) awards.set(runner, source);
      }
    }
  }
  awardAutomatic();
  return awards;
}
export function pathwayCardAwards(state: Pick<GameState, 'rollingRankings' | 'season' | 'tournaments'>) {
  return recordedCardAwards(state, '9999-12-31', true);
}
export type PathwayList = PathwayRegion | 'Senior' | 'Q School UK' | 'Q School Asia';
export function matchesPathwayList(event: {name:string;eventType?:Tournament['type'];tourCircuit?:string}, region:PathwayList) {
 if(region==='Senior') return (!event.eventType||event.eventType==='Senior') && /seniors tour\s*-\s*event/i.test(event.name);
 if(region.startsWith('Q School')) return (!event.eventType||event.eventType==='Q School') && /q school/i.test(event.name) && !/review/i.test(event.name) && (region==='Q School Asia'?/asia/i.test(event.name):!/asia/i.test(event.name));
 return qTourRegion({name:event.name,type:event.eventType,tourCircuit:event.tourCircuit??''})===region;
}
export function pathwayListStatus(state: Pick<GameState,'rollingRankings'|'season'|'currentDate'|'tournaments'>, region:PathwayList, twoYear=false) {
 const cutoff=new Date(state.currentDate+'T12:00:00Z');cutoff.setUTCFullYear(cutoff.getUTCFullYear()-2);
 const completed=Object.values(state.rollingRankings?.events??{}).filter(e=>matchesPathwayList(e,region)&&e.completedOn<=state.currentDate&&(twoYear?e.completedOn>=cutoff.toISOString().slice(0,10):e.season===state.season));
 const next=state.tournaments.filter(t=>matchesPathwayList({name:t.name,eventType:t.type,tourCircuit:t.tourCircuit},region)&&(t.endDate??t.startDate)>state.currentDate).sort((a,b)=>(a.endDate??a.startDate).localeCompare(b.endDate??b.startDate))[0];
 return {completed:completed.length,next,empty:completed.length?'Completed events found, but no scored results are recorded for this list.':next?`No completed events in ${state.season} yet. First results due ${(next.endDate??next.startDate)} Â· ${next.name}.`:`No completed events in ${state.season}; no further event is scheduled for this list.`};
}
export type PathwayStanding = { name: string; points: number; events: number; titles: number; finishes: number[] };
type ResultsState = Pick<GameState, 'rollingRankings' | 'season'>;
const standingsCache = new WeakMap<object, Map<string, PathwayStanding[]>>();
export function pathwayStandings(state: ResultsState, region: PathwayList, before = '9999-12-31', twoYear = false): PathwayStanding[] {
  const events = state.rollingRankings?.events;
  const key = JSON.stringify([state.season,region,before,twoYear]);
  const cache = events ? standingsCache.get(events) ?? new Map<string,PathwayStanding[]>() : undefined;
  if (cache?.has(key)) return cache.get(key)!;
  const rows = new Map<string, PathwayStanding>();
  const cutoff = new Date(before === '9999-12-31' ? '2100-01-01' : before); cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  for (const e of indexedEvents(state.rollingRankings, twoYear ? undefined : state.season)) {
    if (e.completedOn > before || (twoYear ? e.completedOn < cutoff.toISOString().slice(0,10) : e.season !== state.season)) continue;
    const frames = region === 'Senior' || region.startsWith('Q School');
    if (!matchesPathwayList(e,region)) continue;
    const scores = new Map<string, number>();
    const wins = new Set<string>();
    for (const round of e.bracket) for (const m of round.matches) {
      if (m.placeholder || typeof m.top.score !== 'number' || typeof m.bottom.score !== 'number') continue;
      if (m.top.score !== m.bottom.score) wins.add(m.top.score > m.bottom.score ? m.top.name : m.bottom.name);
      for (const [p, other] of [[m.top, m.bottom], [m.bottom, m.top]]) {
        if (frames) scores.set(p.name, (scores.get(p.name) ?? 0) + p.score!);
        else if (p.score! < other.score!) scores.set(p.name, Q_TOUR_POINTS[round.label] ?? 575);
        else if (!scores.has(p.name)) scores.set(p.name, 0);
      }
    }
    const champions = qualifiedNames(e.bracket);
    if (!frames) champions.forEach(n => scores.set(n, Q_TOUR_POINTS.Winner));
    for (const [name, rawPoints] of scores) {
      const points = region === 'Europe' && !wins.has(name) ? 0 : rawPoints;
      const row = rows.get(name) ?? { name, points: 0, events: 0, titles: 0, finishes: [] };
      row.points += points; row.events++; row.titles += !region.startsWith('Q School') && champions.includes(name) ? 1 : 0; row.finishes.unshift(points); rows.set(name, row);
    }
  }
  const result = [...rows.values()].sort((a,b) => b.points - a.points || a.finishes.reduce((difference, score, i) => difference || (b.finishes[i] ?? 0) - score, 0) || a.name.localeCompare(b.name));
  if (events && cache) { cache.set(key,result); if(cache.size>128) cache.delete(cache.keys().next().value!); standingsCache.set(events,cache); }
  return result;
}
export function qTourQualification(state: ResultsState, before = '9999-12-31', canEnter: (name: string) => boolean = () => true) {
  const secured = securedPathwayCards(state, before, false);
  const europe = pathwayStandings(state, 'Europe', before);
  const lastEuropean = Object.values(state.rollingRankings?.events ?? {}).filter(e => e.season === state.season && e.completedOn <= before && matchesPathwayList(e, 'Europe')).sort((a,b) => b.completedOn.localeCompare(a.completedOn))[0];
  const securedAtEuropeEnd = securedPathwayCards(state, lastEuropean?.completedOn ?? before, false);
  const automatic = europe.find(r => !securedAtEuropeEnd.has(r.name))?.name;
  const eligible = europe.filter(r => r.name !== automatic && !secured.has(r.name) && canEnter(r.name));
  const selected = new Set(eligible.filter(r => r.titles > 0).map(r => r.name));
  for (const row of eligible) { if (selected.size >= 16) break; selected.add(row.name); }
  // Regional allocation is fixed in this fictional field: two places per represented region;
  // unfilled regional places revert to the next eligible European players.
  for (const region of ['Asia Pacific', 'Middle East', 'Americas'] as const) {
    for (const r of pathwayStandings(state, region, before).filter(r => !secured.has(r.name) && r.name !== automatic && !selected.has(r.name) && canEnter(r.name)).slice(0,2)) selected.add(r.name);
  }
  for (const r of eligible) { if (selected.size >= 24) break; selected.add(r.name); }
  return { automatic, playoff: [...selected].slice(0,24) };
}
type SeniorResult = { ranking:string[]; goldenField:string[]; championship:string[]; british:string[] };
const seniorCache = new WeakMap<object, Map<string, {world:GameState['worldPlayers']; tables:GameState['competitionTables']; result:SeniorResult}>>();
export function seniorQualification(state: Pick<GameState, 'rollingRankings' | 'season' | 'competitionTables' | 'worldPlayers' | 'player'>, before: string) {
  const events=state.rollingRankings?.events;
  const key=JSON.stringify([state.season,before,state.player.fullName,state.player.age,state.player.dateOfBirth]);
  const cache=events ? seniorCache.get(events) ?? new Map() : undefined;
  const saved=cache?.get(key);
  if(saved?.world===state.worldPlayers && saved?.tables===state.competitionTables) return saved.result as SeniorResult;
  const eligibleNames=new Set(state.worldPlayers.filter(p=>p.age>=40&&!p.retired).map(p=>p.playerName));
  const eligible = (name:string) => name===state.player.fullName ? ageAtDate(state.player.age,state.player.dateOfBirth,before)>=40 : eligibleNames.has(name);
  const official = pathwayStandings(state, 'Senior', before, true).filter(r => eligible(r.name));
  const race = pathwayStandings(state, 'Senior', before).filter(r => eligible(r.name));
  const ranking = new Set(official.slice(0,2).map(r => r.name));
  race.filter(r => !ranking.has(r.name)).slice(0,2).forEach(r => ranking.add(r.name));
  const invites = state.competitionTables.world.filter(r => eligible(r.playerName) && (r.ranking <= 32 || r.titles > 0)).slice(0,12).map(r => r.playerName);
  const winners = Object.values(state.rollingRankings?.events ?? {}).filter(e => e.completedOn < before && /world seniors championship|british seniors open/i.test(e.name)).flatMap(e => qualifiedNames(e.bracket)).filter(eligible);
  const base = new Set([...ranking, ...invites, ...winners]);
  const goldenField = official.filter(r => !base.has(r.name)).slice(0,16).map(r => r.name);
  const golden = Object.values(state.rollingRankings?.events ?? {}).filter(e => e.season === state.season && e.completedOn < before && /golden ticket/i.test(e.name)).flatMap(e => qualifiedNames(e.bracket));
  const championship = [...new Set([...base, ...golden])];
  // Remaining invitations use the seniors list in this generated player world.
  for (const row of state.competitionTables.senior) { if (championship.length >= 24) break; if (eligible(row.playerName) && !championship.includes(row.playerName)) championship.push(row.playerName); }
  const result = { ranking: [...ranking], goldenField, championship: championship.slice(0,24), british: [...new Set([...invites, ...official.map(r => r.name)])].slice(0,8) };
  if(events && cache) {cache.set(key,{world:state.worldPlayers,tables:state.competitionTables,result});if(cache.size>32)cache.delete(cache.keys().next().value!);seniorCache.set(events,cache);}
  return result;
}

export function pathwayRuleSummary(t: Tournament): string[] {
  const rules: string[] = [], age = pathwayAgeLimit(t);
  if (age) rules.push('Under ' + age + ' on ' + pathwayAgeDate(t));
  if (t.type === 'Q School') rules.push('No fixed minimum age; junior consent and entry acceptance are handled automatically.', /asia[ -]*oceania/i.test(t.name) ? 'Asian/Oceanian citizenship; two card winners per event.' : 'Open nationality; four card winners per event.', 'One campaign fee covers both events. Card winners leave subsequent Q School events. One OOM point per frame won.');
  if (t.type === 'Q Tour') rules.push(/play.off/i.test(t.name) ? 'Qualified field only; three section winners earn two-year tour cards.' : qTourRegion(t) === 'Europe' ? 'European standings only determine the automatic card; opening-match losses earn zero points.' : 'Six months of regional residence required; regional results feed the Global Play-Offs.');
  if (t.type === 'Senior') rules.push('Age 40+, including active professionals.', /seniors tour.*event/i.test(t.name) ? 'One ranking point per frame won; top two on each of the two-year and one-year lists qualify, without duplicates.' : 'Entry through ranking, Golden Ticket qualification or a simulated invitation.');
  if (/ebsa/i.test(t.name)) rules.push('European federation entry; age cut-off is 31 March of the championship year.');
  return rules;
}
