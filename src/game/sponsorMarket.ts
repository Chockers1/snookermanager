import type { GameState } from '../hooks/useGameState';
import type { SponsorOfferCard } from '../types/game';

export type SponsorMarketState = { season: string; highestTier: number; companyIds: string[]; previousCompanyIds: string[]; batches: number };
export type SeasonalSponsorTerms = { season: string; companyId: string; requiredTier: number; offeredFor: string };
const tierNames = ['No market', 'Local', 'Regional', 'National', 'International', 'Global'];
const minimumRep = [0, 0, 10, 25, 45, 65];
const basePay = [0, 180, 500, 1300, 3200, 7000];
const categories = ['Local Business', 'Cue Maker', 'Clothing Sponsor', 'Hospitality Partner', 'Travel Partner', 'Social Media Partner'];
const behaviours = ['Community appearances', 'Equipment care and workshop features', 'Professional presentation', 'Travel features and guest appearances', 'Local promotional appearances', 'Regular match and training updates'];
const companyNames = [
  'Willow Lane Cafe|Meadow Cues|Baize Street Tailors|Clubhouse Rooms|Townline Travel|Local Table Media|Corner Stone Coffee|Oakbridge Cues|First Frame Clothing|Green Door Inns|Club Link Cars|Next Frame Journal',
  'County Sports Stores|Ashford Cue Works|Ridgeway Menswear|Harbour Rest Hotels|Regional Rail Travel|Circuit Lens Media|Baize District Leisure|Clearwater Cues|Northfield Sportswear|Market Square Hotels|County Coach Travel|Rising Player Network',
  'Summit Sports Group|Meridian Cue Co.|Regent Matchwear|Landmark Hotel Group|Cross Country Travel|National Baize Network|Civic Leisure Group|TrueLine Cue Works|Modern Frame Apparel|Atlas City Hotels|Matchday Travel Group|Inside Snooker Media',
  'Continental Sports Partners|Aurora Precision Cues|Sterling Tourwear|Horizon International Hotels|Intercity Air Partners|World Table Broadcasting|Crossborder Leisure|Apex Cue Engineering|Ambassador Matchwear|Voyager Hotel Collection|Tour Route Airways|Global Frame Studios',
  'Crestline Global Sports|Sovereign Cues|Imperial Sporting Cloth|Grand Meridian Resorts|Orbit International Airways|Prime Arena Media|Pinnacle World Leisure|Masterline Precision|Legacy Tour Apparel|Crown Harbour Resorts|Continental Sky Travel|Championship Screen Network',
];
export const seasonalSponsorCompanies = companyNames.flatMap((group, tierIndex) => group.split('|').map((name,index) => ({
  id:'brand-'+(tierIndex+1)+'-'+index, name, tier:tierIndex+1, category:categories[index%categories.length], behaviour:behaviours[index%behaviours.length], index,
})));
function hash(value: string) { let result=2166136261; for (const c of value) result=Math.imul(result^c.charCodeAt(0),16777619); return result>>>0; }

export function sponsorMarketProfile(state: GameState) {
  const rank=state.rankings.find(r=>r.playerName===state.player.fullName)?.ranking ?? null;
  const rep=state.player.reputation;
  let circuit: string, reach: number;
  if(state.careerSystems.lateCareer.retired) { circuit='Retired';reach=0; }
  else if(state.careerSystems.lateCareer.seniorActive || /senior/i.test(state.player.rankingLabel)) { circuit='Senior tour';reach=rank!==null&&rank<=16?3:2; }
  else if(state.careerSystems.pro.hasTourCard) { circuit='Main tour';reach=rank!==null&&rank<=16?5:rank!==null&&rank<=32?4:3; }
  else if(/youth|junior/i.test(state.player.rankingLabel+' '+state.player.careerStage)) { circuit='Youth tour';reach=1; }
  else if(/q school/i.test(state.player.rankingLabel)) { circuit='Q School';reach=2; }
  else if(/q tour/i.test(state.player.rankingLabel)) { circuit='Q Tour';reach=2; }
  else { circuit='Amateur tour';reach=rank!==null&&rank<=16?2:1; }
  const reputationTier=rep>=65?5:rep>=45?4:rep>=25?3:rep>=10?2:1;
  const tier=Math.min(reach,reputationTier);
  return { tier, circuit, rank, label:circuit+(rank===null?' · unranked':' · #'+rank)+' · '+tierNames[tier]+' sponsors' };
}

export function seasonalSponsorBlocker(state: GameState, offer: SponsorOfferCard): string | null {
  if(!offer.seasonal) return null;
  if(offer.seasonal.season!==state.season) return 'This offer expired at the end of '+offer.seasonal.season+'. Review the current season’s approaches.';
  if(sponsorMarketProfile(state).tier<offer.seasonal.requiredTier) return 'This company requires '+tierNames[offer.seasonal.requiredTier].toLowerCase()+' exposure. Your current tour, ranking or reputation no longer meets its offer requirements.';
  return null;
}

/** Quote each approach once. Reloads, training and negotiations must never reroll its terms. */
export function reconcileSponsorMarket(state: GameState): GameState {
  const profile=sponsorMarketProfile(state), old=state.sponsorMarket;
  const newSeason=old?.season!==state.season;
  const promotion=!newSeason && profile.tier>old.highestTier;
  if(!newSeason && !promotion) return state;
  const previousIds=newSeason ? old?.companyIds ?? [] : old.previousCompanyIds;
  const currentIds=newSeason ? [] : old.companyIds;
  const blocked=new Set([...previousIds,...currentIds]);
  const activeNames=new Set(state.sponsors.map(s=>s.name));
  const candidates=seasonalSponsorCompanies.filter(c=>c.tier<=profile.tier && c.tier>=Math.max(1,profile.tier-1) && !blocked.has(c.id) && !activeNames.has(c.name))
    .sort((a,b)=>b.tier-a.tier || hash(state.worldSeed+':'+state.season+':'+a.id)-hash(state.worldSeed+':'+state.season+':'+b.id));
  const chosen=candidates.slice(0,newSeason?6:2);
  const offers:GameState['sponsorOffers']=chosen.map(c=>{
    const seed=hash(state.worldSeed+':'+state.season+':terms:'+c.id);
    const rankFactor=1.1-Math.min(profile.rank??128,128)/640;
    const monthlyValue=Math.max(50,Math.round(basePay[c.tier]*(0.85+state.player.reputation/250)*rankFactor*(0.85+(seed%31)/100)/25)*25);
    const months=c.tier===1?(seed%2?6:12):c.tier<=3?(seed%2?12:18):(seed%2?24:36);
    return { id:'season-offer-'+state.season+'-'+c.id, name:c.name, category:c.category, monthlyValue, contractLength:months+' months', minimumReputation:minimumRep[c.tier],
      bonusClause:'Event win +£'+Math.round(monthlyValue*1.5).toLocaleString('en-GB'), behaviour:c.behaviour,
      brandFit:70+seed%26, risk:c.tier>=4&&seed%5===0?'Risky Terms':seed%3===0?'Medium Risk':'Low Risk',
      tags:['New '+state.season,tierNames[c.tier]], note:'Approached for '+profile.label+'. Quoted terms remain fixed this season; unaccepted offers expire at season end.',
      seasonal:{season:state.season,companyId:c.id,requiredTier:c.tier,offeredFor:profile.label}, status:'Available', negotiationCount:0, notes:[],
    };
  });
  // Keep existing approaches on first migration; rotate them at the next annual review.
  const retained=newSeason && old ? state.sponsorOffers.filter(o=>o.status==='Accepted'&&activeNames.has(o.name)) : state.sponsorOffers;
  const batches=newSeason?1:old.batches+1;
  const messageId='sponsor-market:'+state.season+':'+batches;
  const inbox=offers.length ? [{id:messageId,sender:'Commercial Team',subject:newSeason?state.season+' sponsorship approaches':'New sponsors after your career progress',
    preview:offers.length+' companies have approached you for '+profile.label+'. '+offers.slice(0,3).map(o=>o.name).join(', ')+'. Offers range from £'+Math.min(...offers.map(o=>o.monthlyValue)).toLocaleString('en-GB')+' to £'+Math.max(...offers.map(o=>o.monthlyValue)).toLocaleString('en-GB')+'/month. Existing signed contracts continue on their agreed terms.',
    date:state.currentDate,priority:'Medium' as const,read:false,actionLabel:'Review Sponsor Offers',actionRoute:'/sponsorship'},...state.inbox.filter(m=>m.id!==messageId)].slice(0,18) : state.inbox;
  return {...state,sponsorMarket:{season:state.season,highestTier:Math.max(newSeason?0:old.highestTier,profile.tier),companyIds:[...currentIds,...chosen.map(c=>c.id)],previousCompanyIds:previousIds,batches},
    sponsorOffers:[...offers,...retained],inbox,player:{...state.player,inboxCount:Math.min(99,inbox.filter(m=>!m.read).length),notificationCount:Math.min(99,inbox.filter(m=>!m.read).length)}};
}
