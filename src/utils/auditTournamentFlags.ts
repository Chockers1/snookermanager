import { getCanonicalFinishFlags } from './canonicalTournamentResult';

export function repairAuditTournamentFlags<T extends { result: string; type: string; isQualifier: boolean; isRankingEvent: boolean; isWorldMainDraw: boolean; levelBucket: string; canonicalResult?: { roundReached: string } }>(tournament: T) {
  const flags = getCanonicalFinishFlags(tournament.canonicalResult?.roundReached ?? tournament.result, tournament.result);
  const title = flags.isTitle;
  const major = tournament.type === 'Major' && !tournament.isQualifier;
  return { ...tournament, isMajor: major, titleAwarded: title,
    countedInTotalTitleRecord: title && !tournament.isQualifier && tournament.levelBucket !== 'qSchool',
    countedInRankingTitleRecord: title && tournament.isRankingEvent && !tournament.isQualifier,
    countedInMajorTitleRecord: title && major,
    countedInWorldTitleRecord: title && tournament.isWorldMainDraw,
    canonicalResult: { ...tournament.canonicalResult, ...flags,
      isRankingTitle: title && tournament.isRankingEvent && !tournament.isQualifier,
      isMajorTitle: title && major, isWorldTitle: title && tournament.isWorldMainDraw },
  };
}
