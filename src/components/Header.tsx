import React from 'react';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'history' | 'inventory';
  setActiveTab: (tab: 'overview' | 'history' | 'inventory') => void;
  onOpenNewLoan: () => void;
  activeLoanCount: number;
  overdueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewLoan,
  activeLoanCount,
  overdueCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-4">
          {/* Brand Zone with official emblem */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-sky-500 shadow-xs group-hover:border-sky-600 transition-all flex items-center justify-center shrink-0">
              <img 
                src="/logo-thatthong.jpg" 
                alt="ตรา รพ.สต.บ้านธาตุทอง" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback if needed
                  (e.target as HTMLImageElement).src = '/assets/aistudio/315691428_1780891938943660_2416256076651751482_n_65d60f61.jpg';
                }}
              />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight group-hover:text-sky-700 transition-colors">
                ระบบยืมของ รพ.สต.ธาตุทอง
              </div>
              <div className="text-xs text-sky-700/80 font-medium hidden sm:block">
                โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านธาตุทอง · อบจ.สกลนคร
              </div>
            </div>
          </div>

          {/* Navigation Links: Overview, History, Inventory */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              ภาพรวม / สถานะ
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap relative cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>ประวัติการยืม</span>
              {activeLoanCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full tabular-nums">
                  {activeLoanCount}
                </span>
              )}
              {overdueCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full tabular-nums">
                  {overdueCount} เกินกำหนด
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คลังอุปกรณ์
            </button>
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenNewLoan}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-xs hover:shadow transition-all whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกการยืม</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
