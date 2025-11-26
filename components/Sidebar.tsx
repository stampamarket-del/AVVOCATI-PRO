
import React from 'react';
import { type View } from '../types';
import { DashboardIcon, ClientsIcon, PracticesIcon, CalendarIcon, WandIcon, ReminderIcon, AISearchIcon, ReportingIcon, BriefcaseIcon, LawyersIcon, LettersIcon, CalculatorIcon, ArchiveBoxIcon, ShieldIcon, LogoutIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'clients', label: 'Clienti', icon: <ClientsIcon /> },
    { id: 'practices', label: 'Pratiche', icon: <PracticesIcon /> },
    { id: 'lawyers', label: 'Avvocati', icon: <LawyersIcon /> },
    { id: 'reminders', label: 'Scadenziario', icon: <ReminderIcon /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarIcon /> },
    { id: 'ai-assistant', label: 'Assistente AI', icon: <WandIcon /> },
    { id: 'letters', label: 'Lettere Salvate', icon: <LettersIcon /> },
    { id: 'ai-search', label: 'Ricerca AI', icon: <AISearchIcon /> },
    { id: 'quotes', label: 'Preventivi', icon: <CalculatorIcon /> },
    { id: 'quotelist', label: 'Preventivi Salvati', icon: <ArchiveBoxIcon /> },
    { id: 'reporting', label: 'Report', icon: <ReportingIcon /> },
  ];

  const bottomNavItems = [
    { id: 'firm-profile', label: 'Profilo Studio', icon: <BriefcaseIcon /> },
  ];

  if (user?.role === 'admin') {
      bottomNavItems.push({ id: 'admin', label: 'Amministrazione', icon: <ShieldIcon /> });
  }

  const isViewActive = (viewId: View) => {
    if (viewId === 'clients' && currentView === 'client-detail') return true;
    if (viewId === 'practices' && currentView === 'practice-detail') return true;
    return currentView === viewId;
  };

  return (
    <div className="w-16 md:w-64 bg-primary text-white flex flex-col transition-all duration-300 print:hidden h-screen sticky top-0">
      <div className="flex items-center justify-center md:justify-start p-4 md:pl-6 h-16 border-b border-blue-800 shrink-0">
        <svg className="w-8 h-8 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.903l-9 5.25-9-5.25v6.378l9 5.25 9-5.25v-6.378z" />
            <path d="M12 21.75l-9-5.25v-6.378l9 5.25 9-5.25v6.378l-9 5.25z" />
        </svg>
        <h1 className="hidden md:block ml-3 text-xl font-bold truncate">AI Legal CRM</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-4 scrollbar-thin scrollbar-thumb-blue-800">
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
                isViewActive(item.id as View)
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden md:block ml-4 truncate">{item.label}</span>
            </button>
          ))}
          
          <div className="my-2 border-t border-blue-800"></div>

          {bottomNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
                isViewActive(item.id as View)
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden md:block ml-4 truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-blue-800 shrink-0">
         <div className="flex items-center mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {user?.name.charAt(0)}
            </div>
            <div className="hidden md:block ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-blue-300 truncate capitalize">{user?.role}</p>
            </div>
         </div>
         <button
            onClick={logout}
            className="flex items-center w-full p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
         >
            <LogoutIcon />
            <span className="hidden md:block ml-4">Disconnetti</span>
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
