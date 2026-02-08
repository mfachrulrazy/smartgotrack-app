import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useContext(AppContext);
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <i className="fas fa-shopping-basket"></i>
          <span>SmartGotrack</span>
        </div>
        
        <div className="relative">
            <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="focus:outline-none"
            >
                {user?.photoURL ? (
                    <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="w-9 h-9 rounded-full border-2 border-emerald-100 p-0.5 hover:border-emerald-300 transition-colors"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <span className="font-bold text-sm">{user?.displayName?.charAt(0) || "U"}</span>
                    </div>
                )}
            </button>

            {/* Simple Dropdown */}
            {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button 
                        onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            )}
            {/* Backdrop for menu */}
            {showProfileMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
            )}
        </div>
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
