export const CALENDAR_MODEL = {
  name: 'expanded-tour',
  rankingEventsMin: 14,
  rankingEventsMax: 18,
  qualifierEventsMin: 4,
  qualifierEventsMax: 8,
  playersSeriesMin: 2,
  playersSeriesMax: 3,
  qTourEventsMin: 5,
  qTourEventsMax: 8,
  qSchoolEventsMin: 3,
  qSchoolEventsMax: 4,
  top16EventsMin: 12,
  top16EventsMax: 18,
  top16LowWarning: 10,
  top32EventsMin: 10,
  top32EventsMax: 16,
  top32LowWarning: 8,
  top64EventsMin: 8,
  top64EventsMax: 14,
  top64LowWarning: 6,
  bottomTourEventsMin: 6,
  bottomTourEventsMax: 12,
  bottomTourLowWarning: 5,
  rookieProEventsMin: 6,
  rookieProEventsMax: 12,
  rookieProLowWarning: 5,
  qTourPathwayEventsMin: 5,
  qTourPathwayEventsMax: 8,
  qTourPathwayLowWarning: 4,
  qSchoolCampaignEventsMin: 1,
  qSchoolCampaignEventsMax: 4,
  qSchoolCampaignLowWarning: 1,
  youthEventsMin: 8,
  youthEventsMax: 20,
  amateurEventsMin: 8,
  amateurEventsMax: 20,
  seniorEventsMin: 3,
  seniorEventsMax: 8,
} as const

export type EventVolumeThreshold = {
  minimum: number
  maximum: number
  lowWarning: number
}

export function getCalendarModelSummary() {
  return `Calendar model (${CALENDAR_MODEL.name}): ranking ${CALENDAR_MODEL.rankingEventsMin}-${CALENDAR_MODEL.rankingEventsMax} | qualifiers ${CALENDAR_MODEL.qualifierEventsMin}-${CALENDAR_MODEL.qualifierEventsMax} | Players Series ${CALENDAR_MODEL.playersSeriesMin}-${CALENDAR_MODEL.playersSeriesMax} | Q Tour ${CALENDAR_MODEL.qTourEventsMin}-${CALENDAR_MODEL.qTourEventsMax} | Q School ${CALENDAR_MODEL.qSchoolEventsMin}-${CALENDAR_MODEL.qSchoolEventsMax} | Top 16 ${CALENDAR_MODEL.top16EventsMin}-${CALENDAR_MODEL.top16EventsMax} | Top 64 ${CALENDAR_MODEL.top64EventsMin}-${CALENDAR_MODEL.top64EventsMax} | Bottom/Rookie ${CALENDAR_MODEL.bottomTourEventsMin}-${CALENDAR_MODEL.bottomTourEventsMax}`
}

export function getEventVolumeThresholdForBand(accessBand: string): EventVolumeThreshold {
  switch (accessBand) {
    case 'Top 16':
      return { minimum: CALENDAR_MODEL.top16EventsMin, maximum: CALENDAR_MODEL.top16EventsMax, lowWarning: CALENDAR_MODEL.top16LowWarning }
    case 'Top 32':
      return { minimum: CALENDAR_MODEL.top32EventsMin, maximum: CALENDAR_MODEL.top32EventsMax, lowWarning: CALENDAR_MODEL.top32LowWarning }
    case 'Top 64':
      return { minimum: CALENDAR_MODEL.top64EventsMin, maximum: CALENDAR_MODEL.top64EventsMax, lowWarning: CALENDAR_MODEL.top64LowWarning }
    case 'Bottom Tour 65-128':
      return { minimum: CALENDAR_MODEL.bottomTourEventsMin, maximum: CALENDAR_MODEL.bottomTourEventsMax, lowWarning: CALENDAR_MODEL.bottomTourLowWarning }
    case 'Rookie Pro':
      return { minimum: CALENDAR_MODEL.rookieProEventsMin, maximum: CALENDAR_MODEL.rookieProEventsMax, lowWarning: CALENDAR_MODEL.rookieProLowWarning }
    case 'Q Tour':
      return { minimum: CALENDAR_MODEL.qTourPathwayEventsMin, maximum: CALENDAR_MODEL.qTourPathwayEventsMax, lowWarning: CALENDAR_MODEL.qTourPathwayLowWarning }
    case 'Q School':
      return { minimum: CALENDAR_MODEL.qSchoolCampaignEventsMin, maximum: CALENDAR_MODEL.qSchoolCampaignEventsMax, lowWarning: CALENDAR_MODEL.qSchoolCampaignLowWarning }
    case 'Youth':
      return { minimum: CALENDAR_MODEL.youthEventsMin, maximum: CALENDAR_MODEL.youthEventsMax, lowWarning: 1 }
    case 'Amateur':
      return { minimum: CALENDAR_MODEL.amateurEventsMin, maximum: CALENDAR_MODEL.amateurEventsMax, lowWarning: 1 }
    case 'Senior/Legend':
      return { minimum: CALENDAR_MODEL.seniorEventsMin, maximum: CALENDAR_MODEL.seniorEventsMax, lowWarning: 1 }
    default:
      return { minimum: 0, maximum: 99, lowWarning: 0 }
  }
}