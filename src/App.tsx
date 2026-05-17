import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'

const DashboardPage = lazy(() => import('./routes/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const NewCareerPage = lazy(() => import('./routes/NewCareerPage').then((module) => ({ default: module.NewCareerPage })))
const CareerProgressionPage = lazy(() => import('./routes/CareerProgressionPage').then((module) => ({ default: module.CareerProgressionPage })))
const LegacyStatsPage = lazy(() => import('./routes/LegacyStatsPage').then((module) => ({ default: module.LegacyStatsPage })))
const PlayerAttributesPage = lazy(() => import('./routes/PlayerAttributesPage').then((module) => ({ default: module.PlayerAttributesPage })))
const TrainingPlannerPage = lazy(() => import('./routes/TrainingPlannerPage').then((module) => ({ default: module.TrainingPlannerPage })))
const TrainingReportPage = lazy(() => import('./routes/TrainingReportPage').then((module) => ({ default: module.TrainingReportPage })))
const CoachMarketPage = lazy(() => import('./routes/CoachMarketPage').then((module) => ({ default: module.CoachMarketPage })))
const CoachProfilePage = lazy(() => import('./routes/CoachProfilePage').then((module) => ({ default: module.CoachProfilePage })))
const FinancePage = lazy(() => import('./routes/FinancePage').then((module) => ({ default: module.FinancePage })))
const CueShopPage = lazy(() => import('./routes/CueShopPage').then((module) => ({ default: module.CueShopPage })))
const TournamentCalendarPage = lazy(() => import('./routes/TournamentCalendarPage').then((module) => ({ default: module.TournamentCalendarPage })))
const TravelPlannerPage = lazy(() => import('./routes/TravelPlannerPage').then((module) => ({ default: module.TravelPlannerPage })))
const TournamentHubPage = lazy(() => import('./routes/TournamentHubPage').then((module) => ({ default: module.TournamentHubPage })))
const TournamentDrawPage = lazy(() => import('./routes/TournamentDrawPage').then((module) => ({ default: module.TournamentDrawPage })))
const MatchPreviewPage = lazy(() => import('./routes/MatchPreviewPage').then((module) => ({ default: module.MatchPreviewPage })))
const LiveMatchPage = lazy(() => import('./routes/LiveMatchPage').then((module) => ({ default: module.LiveMatchPage })))
const MatchResultPage = lazy(() => import('./routes/MatchResultPage').then((module) => ({ default: module.MatchResultPage })))
const RankingsPage = lazy(() => import('./routes/RankingsPage').then((module) => ({ default: module.RankingsPage })))
const SponsorshipOffersPage = lazy(() => import('./routes/SponsorshipOffersPage').then((module) => ({ default: module.SponsorshipOffersPage })))
const SponsorshipContractPage = lazy(() => import('./routes/SponsorshipContractPage').then((module) => ({ default: module.SponsorshipContractPage })))
const InboxPage = lazy(() => import('./routes/InboxPage').then((module) => ({ default: module.InboxPage })))
const MentalStatePage = lazy(() => import('./routes/MentalStatePage').then((module) => ({ default: module.MentalStatePage })))
const HealthCentrePage = lazy(() => import('./routes/HealthCentrePage').then((module) => ({ default: module.HealthCentrePage })))
const SeasonReviewPage = lazy(() => import('./routes/SeasonReviewPage').then((module) => ({ default: module.SeasonReviewPage })))

function RouteLoadingFallback() {
  return (
    <div className="rounded-2xl border border-scm-border bg-scm-panelSoft/90 px-6 py-10 text-center text-sm text-scm-textSoft">
      Loading table view...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/new-career" element={<NewCareerPage />} />
            <Route path="/career/progression" element={<CareerProgressionPage />} />
            <Route path="/career/stats" element={<LegacyStatsPage />} />
            <Route path="/player/attributes" element={<PlayerAttributesPage />} />
            <Route path="/training" element={<TrainingPlannerPage />} />
            <Route path="/training/report" element={<TrainingReportPage />} />
            <Route path="/staff/coaches" element={<CoachMarketPage />} />
            <Route path="/staff/coaches/:id" element={<CoachProfilePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/equipment/cues" element={<CueShopPage />} />
            <Route path="/equipment/chalk-tips" element={<CueShopPage />} />
            <Route path="/equipment/cases" element={<CueShopPage />} />
            <Route path="/equipment/maintenance" element={<CueShopPage />} />
            <Route path="/equipment/table-setup" element={<CueShopPage />} />
            <Route path="/calendar" element={<TournamentCalendarPage />} />
            <Route path="/travel" element={<TravelPlannerPage />} />
            <Route path="/tournaments/hub" element={<TournamentHubPage />} />
            <Route path="/tournaments/draw" element={<TournamentDrawPage />} />
            <Route path="/match/preview" element={<MatchPreviewPage />} />
            <Route path="/match/live" element={<LiveMatchPage />} />
            <Route path="/match/result" element={<MatchResultPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/sponsorship" element={<SponsorshipOffersPage />} />
            <Route path="/sponsorship/contract" element={<SponsorshipContractPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/mental" element={<MentalStatePage />} />
            <Route path="/health" element={<HealthCentrePage />} />
            <Route path="/season-review" element={<SeasonReviewPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
