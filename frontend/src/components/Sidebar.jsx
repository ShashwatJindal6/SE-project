function Sidebar({ currentPage, isSidebarOpen, onClose }) {
  const links = [
    { name: 'Dashboard',         path: '#/dashboard',    icon: 'dashboard',        id: 'dashboard' },
    { name: 'Applications',      path: '#/applications', icon: 'list_alt',         id: 'applications' },
    { name: 'Pipeline Board',    path: '#/board',        icon: 'view_kanban',      id: 'board' },
    { name: 'Notes',             path: '#/notes',        icon: 'sticky_note_2',    id: 'notes' },
    { name: 'Offer Comparison',  path: '#/compare',      icon: 'compare_arrows',   id: 'compare' },
    { name: 'Add Application',   path: '#/add-new',      icon: 'add_circle',       id: 'add-new' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-200 backdrop-blur-sm"
        />
      )}

      {/* Navigation Drawer */}
      <nav
        id="sidebar"
        className={`fixed left-0 top-0 h-full w-sidebar-width z-50 flex flex-col py-6 px-3 gap-1 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-3 mb-6 flex items-center justify-between">
          <a href="#/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            {/* AFTERGLOW flame icon mark */}
            <div className="sidebar-brand-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 2C7.5 5.5 7 8 9 10C7 8.5 5 10.5 7.5 13C6 12.5 5.5 14.5 8 16C9.5 16.8 12 16.8 13.5 16C16.5 14.5 15.5 12 14 13C16.5 10.5 14 8 12 10C13.5 7.5 12 4.5 10 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="sidebar-brand-name">InternWin</span>
          </a>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-text hover:text-primary-text hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-0.5 flex-grow">
          {links.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <li key={link.id}>
                <a
                  href={link.path}
                  className={`nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                    isActive ? 'nav-active' : ''
                  }`}
                  onClick={onClose}
                >
                  <span
                    className="material-symbols-outlined text-[20px] flex-shrink-0"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {link.icon}
                  </span>
                  <span className="text-sm font-600">{link.name}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Footer — Profile link */}
        <div className="mt-auto pt-3 border-t border-[rgba(216,204,255,0.08)]">
          <a
            href="#/profile"
            className={`nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              currentPage === 'profile' ? 'nav-active' : ''
            }`}
            onClick={onClose}
          >
            <span
              className="material-symbols-outlined text-[20px] flex-shrink-0"
              style={{ fontVariationSettings: currentPage === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
            >
              person
            </span>
            <span className="text-sm font-600">Profile</span>
          </a>

          {/* Brand tagline */}
          <p className="px-3 mt-4 text-[10px] font-semibold tracking-widest uppercase text-[rgba(166,156,184,0.40)]">
            Your next chapter starts here.
          </p>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
