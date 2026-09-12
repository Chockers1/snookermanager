import type { GameState } from '../hooks/useGameState';
import { getTournamentCircuitClass, getPlayersSeriesOneYearCutoff, getTournamentEntryAccess } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { pathwayAgeLimit, pathwayAgeDate, pathwayRuleSummary } from './pathwayRules';
import { attachedMainDirectSeeds, rankingCutoffDate, rankingEventKey, shiftYears } from './rollingRankings';

/** Describe the same circuit and cutoff rules used by entry, independently of field size. */
export function tournamentEligibility(state: GameState, event: Tournament) {
  const format = resolveTournamentFormat(event), circuit = getTournamentCircuitClass(event);
  const age = pathwayAgeLimit(event), cutoff = rankingCutoffDate(event);
  let field: string, selection: string;
  switch (circuit) {
    case 'youth':
      field = `Under-${age ?? 21} mixed youth field · off-tour only`;
      selection = 'Age-eligible club juniors, national youth players, amateurs, Q Tour and Q School players can meet here. Your starting level is not a separate division; stronger eligible players may enter. Professional card holders are excluded.';
      break;
    case 'amateur':
      field = /pro.am/i.test(event.name) ? 'Mixed amateur and professional field' : 'Mixed amateur pathways · off-tour only';
      selection = /pro.am/i.test(event.name) ? 'Pro-am entry allows professionals and eligible amateurs to compete together.' : 'Eligible youth, amateur, Q Tour, Q School and off-tour senior players may enter. This is not restricted to players whose profile says Amateur; professional card holders are excluded.';
      break;
    case 'qTour':
      field = /play.off/i.test(event.name) ? 'Qualified regional Q Tour players · off-tour only' : 'Mixed amateur pathways · off-tour only';
      selection = /play.off/i.test(event.name) ? 'Entry requires selection through the European or regional Q Tour standings. The European automatic card winner does not need a play-off place.' : 'Eligible amateurs, youth and Q School players can compete across pathways. Regional residence rules still apply.';
      break;
    case 'qSchool':
      field = 'Professional-card qualifying · off-tour only';
      selection = 'Eligible youth, amateur and Q Tour players may enter. Already-qualified card winners leave subsequent Q School events; participation itself is not promotion.';
      break;
    case 'senior':
      field = 'Age 40+ · amateurs and professionals';
      selection = 'Active professionals may compete against off-tour seniors. Selected championships require a senior ranking place, qualifying win or invitation.';
      break;
    case 'playersSeries':
      field = `Top ${getPlayersSeriesOneYearCutoff(event)} · One-Year Ranking`;
      selection = 'Main-tour status required. Selection uses the one-year list at the cutoff, not your two-year World Ranking. This is a restricted field, not an open qualifying event.';
      break;
    case 'worldChampionshipMain': case 'ukMajor':
      field = 'Top 16 world seeds + successful qualifiers';
      selection = 'Main-tour status required. The top 16 at the World Ranking cutoff enter directly; other entrants must complete the attached qualifying route. This main draw is not top-16-only.';
      break;
    case 'worldChampionshipQualifying':
      field = 'Main-tour cardholders outside the top 16';
      selection = 'Main-tour status required. Top-16 players at the designated cutoff enter the main draw directly. Qualifying places must be won; an early-round win may not finish the route.';
      break;
    case 'rookieQualifier':
      field = 'Main-tour qualifying · protected seeds excluded';
      selection = `Main-tour status is required, including protected cardholders ranked below 128.${format.seedOffset ? ` Top ${format.seedOffset} seeds enter the main draw directly; this qualifier is for lower seeds.` : ''} Successful qualifiers proceed to the attached event.`;
      break;
    case 'eliteInvitational':
      if (/^masters$/i.test(event.name)) {
        field = 'Top 16 · World Ranking';
        selection = 'Main-tour status required. The Masters selects the top 16 on the two-year World Ranking at its cutoff, not the one-year list.';
      } else if (/champion of champions/i.test(event.name)) {
        field = 'Recent singles champions + ranking reserves';
        selection = `Qualifying singles titles from ${shiftYears(cutoff, -1)} to ${cutoff} receive priority. Remaining places use active professional ranking reserves. A lifetime major title does not guarantee an invitation.`;
      } else if (/masters-style|elite season opener/i.test(event.name)) {
        field = 'Top 16 world seeds or established elite players';
        selection = 'This invitational also accepts the game’s Major Contender and World Champion profiles. It is not a strict top-16-only field.';
      } else {
        field = 'Selected upper main-tour players';
        selection = 'The current entry check accepts top-32 World Ranking profiles. The advertised field size and draw seeding are separate from this entry threshold; it is not necessarily top-16-only.';
      }
      break;
    case 'exhibition':
      field = 'Mixed invitation field · amateurs, pros and veterans';
      selection = 'The game accepts main-tour players, elite amateurs, senior-circuit players, age 40+ players or reputation of at least 70. An event named Veteran is not necessarily senior-only.';
      break;
    default:
      field = 'Main-tour field · active professional status';
      selection = 'Active main-tour status or retained top-64 standing is required. Protected cardholders remain eligible below World #128. Entry rounds and seed protection follow the event format; a small late-round field is not an entry restriction.';
  }
  if (['internationalChampionship', 'worldOpen', 'homeNationsMain'].includes(format.id)) {
    field = `Top ${attachedMainDirectSeeds(event)} world seeds + successful qualifiers`;
    selection = 'Main-tour status required. Protected seeds enter directly; all other human entrants must qualify through the attached event.';
  }
  if (format.formatFamily === 'administrative') {
    field = 'Automatic standings review · no entry';
    selection = 'There are no matches to enter. The review uses recorded qualifying results.';
  }
  const restrictions = pathwayRuleSummary(event).filter(rule => !age || !rule.startsWith(`Under ${age} on `));
  if (age) restrictions.unshift(`Age is checked on ${pathwayAgeDate(event)}: under ${age} means younger than ${age}, not ${age} or younger.`);
  const access = getTournamentEntryAccess(state, event);
  const locked = state.rollingRankings?.seedings[rankingEventKey(event)];
  const listRank = circuit === 'playersSeries' ? locked?.oneYear[state.player.fullName] ?? state.careerSystems.pro.oneYearRank : locked?.world[state.player.fullName] ?? state.player.worldRanking;
  const rankedSelection = ['playersSeries', 'eliteInvitational', 'worldChampionshipMain', 'worldChampionshipQualifying', 'ukMajor', 'rookieQualifier', 'ranking'].includes(circuit);
  return { field, selection, restrictions: [...new Set(restrictions)],
    yourSelection: rankedSelection && listRank ? `${circuit === 'playersSeries' ? 'One-Year Ranking' : 'World Ranking'} #${listRank} · ${locked ? 'locked selection' : 'provisional'}` : `Age ${state.player.age} · ${state.careerSystems.pro.hasTourCard ? 'professional card holder' : 'no professional card'}`,
    status: event.status === 'Completed' ? 'Event complete' : ['Entered', 'Booked'].includes(event.status) ? 'Entry secured' : access.allowed ? 'Meets entry rules currently' : 'Entry unavailable',
    reason: access.reason,
    seeding: format.seedingModel,
  };
}
