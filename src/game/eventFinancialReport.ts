import type { GameState } from '../hooks/useGameState';
import type { InboxMessage, Tournament } from '../types/game';
import { dayNumber } from './careerDepth/shared';
export type EventFinancialReport = {
  tournamentId: string; startDate: string; name: string; location: string;
  entry: number; transport: number; hotel: number; nights?: number; nightlyRate?: number; extraNights?: number;
  combinedTravel: boolean; preparation: number; venuePractice: number;
  prize: number; sponsor: number; income: number; costs: number; net: number;
};
const round = (n: number) => Math.round(n*100)/100;
const amount = (value?: string) => value === undefined ? undefined : Number(value.replaceAll(',',''));
export function eventFinancialReport(state: GameState, event: Pick<Tournament,'id'|'startDate'|'name'|'location'>, legacy?: InboxMessage): EventFinancialReport {
  const history=state.history.tournamentHistory.find(h=>h.tournamentId===event.id && h.startDate===event.startDate);
  const current=state.tournaments.some(t=>t.id===event.id && t.startDate===event.startDate);
  const booking=current ? state.travel.bookings[event.id] : undefined;
  const journey=state.realism?.journeys[`${event.id}:${event.startDate}`];
  const legacyCost=legacy?.summary?.find(s=>s.label==='Event costs')?.detail;
  const travel=booking?.totalCost ?? history?.bookedTravelCost ?? amount(legacyCost?.match(/travel £([\d,.]+)/i)?.[1]) ?? 0;
  const rate=journey?.hotelNightlyRate;
  const nights=rate!==undefined && journey?.hotelThrough ? Math.max(1,dayNumber(journey.hotelThrough)-dayNumber(journey.arrival)+1) : undefined;
  // The booked total already includes every paid hotel extension. Split it, never add it again.
  const hotel=nights===undefined || rate===undefined ? 0 : round(nights*rate);
  const canSplit=nights!==undefined && hotel<=travel;
  const prepReceipt=state.finance.ledger.find(t=>t.id===`preparation-${event.id}-${history?.season ?? state.season}` && t.type==='Expense');
  const venueReceipt=state.finance.ledger.find(t=>t.id===`familiarise:${event.id}:${event.startDate}` && t.type==='Expense');
  const entry=history?.entryPaid ?? amount(legacyCost?.match(/Entry £([\d,.]+)/i)?.[1]) ?? history?.entryFee ?? 0;
  const preparation=history?.preparationPaid ?? booking?.preparation?.effects.cost ?? prepReceipt?.amount ?? amount(legacyCost?.match(/preparation £([\d,.]+)/i)?.[1]) ?? 0;
  const venuePractice=history?.venuePracticePaid ?? venueReceipt?.amount ?? (state.realism?.familiarised.includes(`${event.id}:${event.startDate}`)?35:0);
  const recordedMatches=state.matches.filter(m=>m.tournamentId===event.id && (m.season??state.season)===(history?.season??state.season) && m.result!=='In Progress');
  const prize=history?.prizeMoney ?? amount(legacy?.summary?.find(s=>s.label==='Prize money')?.value.match(/£([\d,.]+)/)?.[1]) ?? 0;
  const sponsor=history?.sponsorBonusesPaid ?? Math.max(recordedMatches.reduce((n,m)=>n+(m.sponsorBonusEarned??0),0),amount(legacy?.summary?.find(s=>s.label==='Sponsor bonus')?.value.match(/£([\d,.]+)/)?.[1])??0);
  const costs=round(entry+travel+preparation+venuePractice),income=round(prize+sponsor);
  return {tournamentId:event.id,startDate:event.startDate,name:event.name,location:event.location,entry,transport:round(canSplit?travel-hotel:travel),hotel:canSplit?hotel:0,
    nights:canSplit?nights:undefined,nightlyRate:canSplit?rate:undefined,extraNights:canSplit&&journey?.hotelInitialNights!==undefined?Math.max(0,nights!-journey.hotelInitialNights):undefined,
    combinedTravel:travel>0&&!canSplit,preparation,venuePractice,prize,sponsor,income,costs,net:round(income-costs)};
}
export function financialReportForMessage(state:GameState,message:InboxMessage|null) {
  if (!message?.subject.startsWith('Post-event report: ')) return undefined;
  if (message.eventFinance) return message.eventFinance;
  const name=message.subject.slice('Post-event report: '.length);
  const histories=state.history.tournamentHistory.filter(h=>h.tournamentName===name && h.status==='Completed');
  const dated=/^\d{4}-\d{2}-\d{2}$/.test(message.date);
  const record=histories.length===1?histories[0]:dated?histories.filter(h=>h.startDate<=message.date && (!h.endDate || message.date<=h.endDate)).sort((a,b)=>b.startDate.localeCompare(a.startDate))[0]:undefined;
  // Do not attach a new season's booking to an old message with an ambiguous date.
  if (!record) return undefined;
  return eventFinancialReport(state,{id:record.tournamentId,startDate:record.startDate,name:record.tournamentName,location:record.location},message);
}
export const reportMoney=(n:number)=>'£'+n.toLocaleString('en-GB',{maximumFractionDigits:2});
export function financialSummary(report:EventFinancialReport):NonNullable<InboxMessage['summary']> {
  const hotel=report.combinedTravel?'Hotel included; nights not recorded':`${reportMoney(report.hotel)} (${report.nights??0} nights × ${reportMoney(report.nightlyRate??0)})`;
  return [
    {label:'Prize money',value:reportMoney(report.prize),tone:report.prize>0?'positive':'neutral'},
    {label:'Sponsor bonus',value:reportMoney(report.sponsor),tone:report.sponsor>0?'positive':'neutral'},
    {label:'Event costs',value:'−'+reportMoney(report.costs),detail:`Entry ${reportMoney(report.entry)} · ${report.combinedTravel?'travel & hotel':'travel'} ${reportMoney(report.transport)} · hotel ${hotel} · preparation ${reportMoney(report.preparation)} · venue practice ${reportMoney(report.venuePractice)}`,tone:'negative'},
    {label:'Net finances',value:(report.net>=0?'+':'−')+reportMoney(Math.abs(report.net)),detail:reportMoney(report.income)+' total event income',tone:report.net>=0?'positive':'negative'},
  ];
}
