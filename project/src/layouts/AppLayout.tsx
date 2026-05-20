import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
        <div className="h-8 bg-sidebar border-t border-border flex items-center px-4 gap-3 shrink-0 overflow-hidden">
          <span className="text-[9px] text-green-400 font-medium shrink-0 uppercase">News</span>
          <p className="text-[10px] text-gray-400 truncate min-w-0 flex-1">
            Jack Harrison enters World Championship qualifying as the #21 seed.
            <span className="mx-2 text-gray-600">•</span>
            World Rankings updated: Judd Trump remains #1.
          </p>
          <div className="flex items-center gap-3 text-[10px] shrink-0">
            <span className="text-gray-500 whitespace-nowrap">Season 2024/25</span>
            <span className="text-gray-500 whitespace-nowrap">Wk 32</span>
            <span className="text-gray-400 whitespace-nowrap">12 May 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
