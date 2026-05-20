import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import NewCareer from './pages/NewCareer';
import Inbox from './pages/Inbox';
import Attributes from './pages/player/Attributes';
import Progression from './pages/career/Progression';
import LegacyStats from './pages/career/LegacyStats';
import TrainingPlanner from './pages/training/TrainingPlanner';
import CoachMarket from './pages/staff/CoachMarket';
import EquipmentHub from './pages/equipment/EquipmentHub';
import Finance from './pages/finance/Finance';
import TournamentCalendar from './pages/tournament/Calendar';
import TournamentHub from './pages/tournament/TournamentHub';
import MatchPreview from './pages/match/MatchPreview';
import LiveMatch from './pages/match/LiveMatch';
import MatchResult from './pages/match/MatchResult';
import Rankings from './pages/Rankings';
import Sponsorship from './pages/sponsorship/Sponsorship';
import Mental from './pages/Mental';
import Health from './pages/Health';
import SeasonReview from './pages/SeasonReview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-career" element={<NewCareer />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/player/attributes" element={<Attributes />} />
          <Route path="/career/progression" element={<Progression />} />
          <Route path="/career/stats" element={<LegacyStats />} />
          <Route path="/training" element={<TrainingPlanner />} />
          <Route path="/staff/coaches" element={<CoachMarket />} />
          <Route path="/staff/coaches/:id" element={<CoachMarket />} />
          <Route path="/equipment/cues" element={<EquipmentHub />} />
          <Route path="/equipment/chalk-tips" element={<EquipmentHub />} />
          <Route path="/equipment/cases" element={<EquipmentHub />} />
          <Route path="/equipment/maintenance" element={<EquipmentHub />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/calendar" element={<TournamentCalendar />} />
          <Route path="/tournaments/hub" element={<TournamentHub />} />
          <Route path="/tournaments/draw" element={<TournamentHub />} />
          <Route path="/match/preview" element={<MatchPreview />} />
          <Route path="/match/live" element={<LiveMatch />} />
          <Route path="/match/result" element={<MatchResult />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/sponsorship" element={<Sponsorship />} />
          <Route path="/mental" element={<Mental />} />
          <Route path="/health" element={<Health />} />
          <Route path="/season-review" element={<SeasonReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
