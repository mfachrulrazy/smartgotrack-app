import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => (
    <Link
      to={path}
      className={`flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors ${
        isActive(path) ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <i className={`fas ${icon} text-xl mb-1`}></i>
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <i className="fas fa-shopping-basket"></i>
          <span>SmartGotrack</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <i className="fas fa-user-circle text-2xl"></i>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 flex justify-around items-center z-10 pb-safe">
        <NavItem path="/" icon="fa-home" label="Home" />
        <NavItem path="/compare" icon="fa-chart-line" label="Trends" />
        
        {/* Floating Action Button Placeholder - Visual hack to space out center */}
        <div className="w-12"></div>

        <NavItem path="/chat" icon="fa-robot" label="AI Chat" />
        <NavItem path="/reports" icon="fa-chart-pie" label="Reports" />

        {/* Floating Action Button (FAB) */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <Link
            to="/chat"
            className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-emerald-600 transition-transform active:scale-95 border-4 border-gray-50"
          >
            <i className="fas fa-plus text-xl"></i>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
