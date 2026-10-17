import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Launcher from './pages/Launcher';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Board from './pages/Board';
import AddNew from './pages/AddNew';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Notes from './pages/Notes';
import Compare from './pages/Compare';
import { getApplications, saveApplications } from './services/applicationService';
import { API_BASE_URL } from './config';
import './App.css';

// ── Brand constants (single source of truth) ──────────────────
export const BRAND_NAME    = 'InternWin';
export const BRAND_TAGLINE = 'Your next chapter starts here.';

// ── LocalStorage key helpers (with legacy migration) ───────────
function getAuthState() {
  // Migrate from old internflow_auth key
  if (localStorage.getItem('internflow_auth') === 'true' && !localStorage.getItem('afterglow_auth')) {
    localStorage.setItem('afterglow_auth', 'true');
    const profile = localStorage.getItem('internflow_profile');
    if (profile) localStorage.setItem('afterglow_profile', profile);
    const authUser = localStorage.getItem('internflow_auth_user');
    if (authUser) localStorage.setItem('afterglow_auth_user', authUser);
  }
  return localStorage.getItem('afterglow_auth') === 'true';
}

function getStoredProfile() {
  const stored = JSON.parse(localStorage.getItem('afterglow_profile') || localStorage.getItem('internflow_profile') || 'null');
  if (stored) {
    if (!stored.skills) stored.skills = [];
    return stored;
  }
  return { name: '', role: '', email: '', location: '', education: '', avatar: '', skills: [], resume: null };
}

// ── Route Parser Helper ────────────────────────────────────────
const getRoute = (hash) => {
  if (!hash || hash === '#' || hash === '#/') return { page: 'launcher' };

  if (hash.startsWith('#id=')) {
    return { page: 'applications', id: hash.replace('#id=', '') };
  }
  if (hash === '#list') {
    return { page: 'applications' };
  }

  const cleanHash = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
  const qMarkIndex = cleanHash.indexOf('?');

  let path = cleanHash;
  let searchStr = '';

  if (qMarkIndex !== -1) {
    path = cleanHash.substring(0, qMarkIndex);
    searchStr = cleanHash.substring(qMarkIndex + 1);
  }

  const searchParams = new URLSearchParams(searchStr);
  const search = searchParams.get('search') || '';

  if (path === 'dashboard') return { page: 'dashboard' };
  if (path === 'applications') {
    const id = searchParams.get('id');
    return { page: 'applications', id, search };
  }
  if (path === 'board')    return { page: 'board' };
  if (path === 'notes')    return { page: 'notes' };
  if (path === 'add-new')  return { page: 'add-new' };
  if (path === 'profile')  return { page: 'profile' };
  if (path === 'compare')  return { page: 'compare' };

  return { page: 'dashboard' };
};

function App() {
  const [route, setRoute] = useState(() => getRoute(window.location.hash));
  const [applications, setApplications] = useState(() => getApplications());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompleteProfilePopup, setShowCompleteProfilePopup] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(getAuthState);
  const [profile, setProfile] = useState(getStoredProfile);
  const [isDark, setIsDark] = useState(() => {
    // Default to dark for AFTERGLOW — the brand is a dark-first product
    const stored = localStorage.getItem('afterglow_dark') ?? localStorage.getItem('internflow_dark');
    return stored !== null ? stored === 'true' : true;
  });

  // Theme effect — AFTERGLOW defaults to dark
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('afterglow_dark', isDark ? 'true' : 'false');
  }, [isDark]);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load applications from backend on auth
  useEffect(() => {
    if (isAuthenticated && profile?.email) {
      fetch(`${API_BASE_URL}/api/applications/get-applications?email=${encodeURIComponent(profile.email)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch applications');
          return res.json();
        })
        .then((data) => {
          const mappedData = data.map((app) => ({ ...app, id: app._id || app.id }));
          setApplications(mappedData);
          saveApplications(mappedData);
        })
        .catch((err) => console.error('Error loading applications from database:', err));
    } else if (!isAuthenticated) {
      setApplications([]);
    }
  }, [isAuthenticated, profile?.email]);

  // Load profile from backend on auth
  useEffect(() => {
    const authUser = localStorage.getItem('afterglow_auth_user') || localStorage.getItem('internflow_auth_user');
    if (isAuthenticated && authUser) {
      const email = JSON.parse(authUser).email;
      fetch(`${API_BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then((data) => {
          setProfile(data);
          localStorage.setItem('afterglow_profile', JSON.stringify(data));
        })
        .catch((err) => console.error('Error loading profile from database:', err));
    }
  }, [isAuthenticated]);

  // Sync search queries from route parameters
  useEffect(() => {
    if (route.page === 'applications' && route.search) {
      const id = requestAnimationFrame(() => setSearchQuery(route.search));
      return () => cancelAnimationFrame(id);
    }
  }, [route]);

  // ── Toast Helper ─────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  // ── State mutations ───────────────────────────────────────────
  const updateStatus = async (appId, newStatus) => {
    const updated = applications.map((app) =>
      app.id === appId ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    saveApplications(updated);
    showToast(`Status updated to ${newStatus}`);
    try {
      await fetch(`${API_BASE_URL}/api/applications/update-application/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to persist status update:', err);
    }
  };

  const deleteApplication = async (appId) => {
    const updated = applications.filter((app) => app.id !== appId);
    setApplications(updated);
    saveApplications(updated);
    showToast('Application deleted', 'error');
    try {
      await fetch(`${API_BASE_URL}/api/applications/delete-application/${appId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete application from database:', err);
    }
  };

  const saveNotes = async (appId, newNotes) => {
    const updated = applications.map((app) =>
      app.id === appId ? { ...app, notes: newNotes } : app
    );
    setApplications(updated);
    saveApplications(updated);
    try {
      await fetch(`${API_BASE_URL}/api/applications/update-application/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
    } catch (err) {
      console.error('Failed to save notes to database:', err);
    }
  };

  const addApplication = (newApp) => {
    const updated = [newApp, ...applications];
    setApplications(updated);
    saveApplications(updated);
  };

  const updateProfile = async (updatedProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('afterglow_profile', JSON.stringify(updatedProfile));
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email || updatedProfile.email,
          name: updatedProfile.name,
          role: updatedProfile.role,
          location: updatedProfile.location,
          education: updatedProfile.education,
          avatar: updatedProfile.avatar,
          skills: updatedProfile.skills,
          resume: updatedProfile.resume,
        }),
      });
      if (!response.ok) throw new Error('Failed to update profile in database');
    } catch (err) {
      console.error('Error saving profile to database:', err);
      showToast('Failed to save profile changes to database', 'error');
    }
  };

  const handleSignOut = () => {
    // Clear both old and new keys
    ['afterglow_auth', 'afterglow_profile', 'afterglow_auth_user', 'afterglow_applications',
     'afterglow_notes', 'internflow_auth', 'internflow_profile', 'internflow_auth_user',
     'internflow_applications', 'careerpilot_notes'].forEach(k => localStorage.removeItem(k));
    setProfile({ name: '', role: '', email: '', location: '', education: '', avatar: '', skills: [], resume: null });
    setIsAuthenticated(false);
    window.location.hash = '#/';
    showToast('Signed out successfully', 'info');
  };

  // Launcher splash screen
  if (route.page === 'launcher') return <Launcher />;

  return (
    <div className="font-body-md antialiased overflow-hidden h-screen flex" style={{ color: 'var(--text-primary)', background: 'var(--midnight)' }}>

      {!isAuthenticated ? (
        <Auth
          isDark={isDark}
          setIsDark={setIsDark}
          onAuthSuccess={(userData, isNewSignUp) => {
            setIsAuthenticated(true);
            localStorage.setItem('afterglow_auth', 'true');
            localStorage.setItem('afterglow_auth_user', JSON.stringify(userData));

            const userProfile = {
              name: userData.name, role: '', email: userData.email,
              location: '', education: '', avatar: '', skills: [], resume: null,
            };
            setProfile(userProfile);
            localStorage.setItem('afterglow_profile', JSON.stringify(userProfile));

            if (isNewSignUp) setShowCompleteProfilePopup(true);
            showToast(
              isNewSignUp ? `Welcome to ${BRAND_NAME}, ${userData.name}!` : `Welcome back, ${userData.name}!`,
              'success'
            );
          }}
        />
      ) : (
        <>
          {/* Sidebar */}
          <Sidebar
            currentPage={route.page}
            isSidebarOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 md:ml-sidebar-width h-full overflow-y-auto flex flex-col relative" style={{ background: 'var(--midnight)' }}>
            {/* Header — always rendered */}
            <Header
              onMenuClick={() => setIsSidebarOpen(true)}
              profile={profile}
              isDark={isDark}
              setIsDark={setIsDark}
              showToast={showToast}
              onSignOut={handleSignOut}
              currentPage={route.page}
              searchQuery={searchQuery}
              onSearchChange={route.page === 'applications' ? setSearchQuery : undefined}
            />

            {/* Dynamic Page Views */}
            {route.page === 'dashboard' && (
              <Dashboard
                applications={applications}
                profile={profile}
                onUpdateStatus={updateStatus}
                onDelete={deleteApplication}
                showToast={showToast}
              />
            )}

            {route.page === 'applications' && (
              <Applications
                applications={applications}
                selectedAppId={route.id}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onUpdateStatus={updateStatus}
                onDelete={deleteApplication}
                onSaveNotes={saveNotes}
                showToast={showToast}
              />
            )}

            {route.page === 'board' && (
              <Board
                applications={applications}
                onUpdateStatus={updateStatus}
                onDelete={deleteApplication}
                showToast={showToast}
              />
            )}

            {route.page === 'notes' && (
              <Notes
                applications={applications}
                onSaveNotes={saveNotes}
                showToast={showToast}
                userEmail={profile?.email}
              />
            )}

            {route.page === 'add-new' && (
              <AddNew
                onAdd={addApplication}
                showToast={showToast}
                userEmail={profile?.email}
              />
            )}

            {route.page === 'profile' && (
              <Profile
                profile={profile}
                onUpdateProfile={updateProfile}
                showToast={showToast}
                onSignOut={handleSignOut}
              />
            )}

            {route.page === 'compare' && (
              <Compare
                applications={applications}
                profile={profile}
                showToast={showToast}
              />
            )}
          </main>
        </>
      )}

      {/* ── Complete Profile Popup Modal ────────────────────── */}
      {showCompleteProfilePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(10, 7, 20, 0.80)', backdropFilter: 'blur(10px)' }}>
          <div
            className="relative w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-scale-in"
            style={{
              background: 'rgba(25, 19, 41, 0.98)',
              border: '1px solid rgba(216, 204, 255, 0.18)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,107,0.08)',
            }}
          >
            {/* Sunset top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, #FF6B6B, #FF4FA3, #FF9F43)' }} />

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-4 mt-1">
              <div
                className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FF4FA3)',
                  boxShadow: '0 6px 20px rgba(255,107,107,0.35)',
                }}
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Complete Your Profile</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--brand-coral)' }}>
                  Step 1 of 1 • Personal Details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteProfilePopup(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                style={{ color: 'var(--text-muted)', background: 'rgba(216,204,255,0.06)' }}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm text-left mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Welcome to {BRAND_NAME}! Complete your profile to unlock personalised tracking insights and customised career stats.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updated = {
                  ...profile,
                  name: formData.get('name').trim(),
                  role: formData.get('role').trim(),
                  location: formData.get('location').trim(),
                  education: formData.get('education').trim(),
                  skills: formData.get('skills') ? formData.get('skills').split(',').map(s => s.trim()).filter(Boolean) : [],
                };
                updateProfile(updated);
                setShowCompleteProfilePopup(false);
                showToast('Profile completed successfully!', 'success');
              }}
              className="flex flex-col gap-4 text-left"
            >
              {[
                { name: 'name',      icon: 'person',      label: 'Full Name',                   ph: 'e.g. Alex Johnson',              required: true,  defaultValue: profile?.name || '' },
                { name: 'role',      icon: 'work',        label: 'Current Title / Role',         ph: 'e.g. SWE Intern Candidate',      required: true,  defaultValue: profile?.role || '' },
                { name: 'location',  icon: 'location_on', label: 'Location',                     ph: 'e.g. San Francisco, CA',         required: false, defaultValue: profile?.location || '' },
                { name: 'education', icon: 'school',      label: 'Education',                    ph: 'e.g. UC Berkeley, CS',           required: false, defaultValue: profile?.education || '' },
                { name: 'skills',    icon: 'terminal',    label: 'Skills (comma-separated)',     ph: 'e.g. React, Python, Figma',      required: false, defaultValue: profile?.skills?.join(', ') || '' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>
                    {f.label}
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[18px] pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}>
                      {f.icon}
                    </span>
                    <input
                      name={f.name}
                      type="text"
                      defaultValue={f.defaultValue}
                      required={f.required}
                      placeholder={f.ph}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        background: 'rgba(36,26,53,0.70)',
                        border: '1px solid rgba(216,204,255,0.15)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--brand-coral)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255,107,107,0.12)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(216,204,255,0.15)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-3 pt-3 mt-1 border-t" style={{ borderColor: 'rgba(216,204,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setShowCompleteProfilePopup(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  style={{
                    border: '1px solid rgba(216,204,255,0.15)',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                  }}
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-white font-bold rounded-xl transition-all text-xs cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4FA3 50%, #FF9F43 100%)',
                    boxShadow: '0 4px 16px rgba(255,107,107,0.35)',
                  }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification Container ─────────────────────── */}
      <div id="toast-container" className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => {
          let icon = 'check_circle';
          let accentColor = '#6EE7B7';
          let borderColor = '#34D399';

          if (toast.type === 'error') {
            icon = 'error';
            accentColor = '#FF9B9B';
            borderColor = '#FF6B6B';
          } else if (toast.type === 'info') {
            icon = 'info';
            accentColor = '#93C5FD';
            borderColor = '#60A5FA';
          }

          return (
            <div
              key={toast.id}
              className="flex items-center gap-2.5 px-4 py-3 shadow-xl rounded-xl text-xs font-semibold pointer-events-auto animate-fade-in"
              style={{
                background: 'rgba(25,19,41,0.97)',
                border: `1px solid rgba(216,204,255,0.14)`,
                borderLeft: `3px solid ${borderColor}`,
                color: 'var(--text-primary)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
              }}
            >
              <span className="material-symbols-outlined text-[18px]"
                style={{ color: accentColor, fontVariationSettings: "'FILL' 1" }}>
                {icon}
              </span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
