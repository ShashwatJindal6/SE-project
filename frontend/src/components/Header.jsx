import { useState, useRef, useEffect, useCallback } from 'react';

// Page title mapping
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  applications: 'Applications',
  board:        'Pipeline Board',
  notes:        'Notes',
  compare:      'Offer Comparison',
  'add-new':    'Add Application',
  profile:      'Profile',
};

function Header({
  onMenuClick,
  profile,
  isDark,
  setIsDark,
  showToast,
  onSignOut,
  title,
  searchQuery,
  onSearchChange,
  currentPage,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef  = useRef(null);
  const searchRef  = useRef(null);

  // Keep local search in sync with external prop
  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K / Cmd+K — focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = localSearch.trim();
    window.location.hash = trimmed
      ? `#/applications?search=${encodeURIComponent(trimmed)}`
      : '#/applications';
  }, [localSearch]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    showToast(next ? 'Dark mode activated' : 'Light mode activated');
  };

  const pageTitle = title || PAGE_TITLES[currentPage] || 'InternWin';
  const initials  = (profile?.name || 'U').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header
      className="w-full relative z-40 flex items-center px-4 md:px-6 h-14 gap-3"
      style={{ minHeight: '56px' }}
    >
      {/* ── Left: Mobile menu + page title ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden icon-btn w-9 h-9 flex items-center justify-center"
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Page title */}
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-primary-text leading-none">{pageTitle}</h1>
        </div>
      </div>

      {/* ── Center: Global Search ── */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-muted-text text-[18px] pointer-events-none">
            search
          </span>
          <input
            ref={searchRef}
            id="global-search"
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search applications…"
            className="w-full pl-9 pr-16 py-2 text-sm font-medium transition-all"
            aria-label="Search applications"
          />
          <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 text-[10px] font-semibold text-muted-text bg-[rgba(216,204,255,0.06)] border border-[rgba(216,204,255,0.12)] rounded px-1.5 py-0.5 pointer-events-none select-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Quick Add */}
        <a
          href="#/add-new"
          className="quick-add-btn hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs"
          aria-label="Add new application"
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          <span>New</span>
        </a>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="icon-btn w-9 h-9 flex items-center justify-center"
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Avatar + Profile Menu */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-sunset-coral/50 focus:outline-none focus:ring-2 focus:ring-sunset-coral/50"
            aria-label="Account menu"
            aria-expanded={avatarMenuOpen}
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4FA3 55%, #FF9F43 100%)' }}
              >
                {initials}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {avatarMenuOpen && (
            <div
              className="absolute right-0 top-11 w-56 rounded-2xl z-50 overflow-hidden animate-scale-in"
              style={{
                background: 'rgba(25, 19, 41, 0.97)',
                border: '1px solid rgba(216, 204, 255, 0.18)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,107,0.08)',
              }}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[rgba(216,204,255,0.08)]">
                <p className="text-xs font-bold text-primary-text truncate">{profile?.name || 'User'}</p>
                <p className="text-[11px] text-muted-text truncate mt-0.5">{profile?.email || ''}</p>
              </div>

              {/* View Profile */}
              <a
                href="#/profile"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-muted-text hover:text-primary-text hover:bg-[rgba(216,204,255,0.05)] transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">manage_accounts</span>
                My Profile
              </a>

              {/* Add Application */}
              <a
                href="#/add-new"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-muted-text hover:text-primary-text hover:bg-[rgba(216,204,255,0.05)] transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                Add Application
              </a>

              <div className="border-t border-[rgba(216,204,255,0.08)]" />

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => {
                  setAvatarMenuOpen(false);
                  if (onSignOut) onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-sunset-coral hover:bg-[rgba(255,107,107,0.08)] transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
