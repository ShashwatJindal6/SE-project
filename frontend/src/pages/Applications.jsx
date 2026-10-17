/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from 'react';
import { 
  getCompanyAvatarConfig, 
  getStatusBadgeClass, 
  formatDate 
} from '../utils/helpers';

function Applications({ 
  applications, 
  selectedAppId, 
  searchQuery, 
  onSearchChange,
  onUpdateStatus, 
  onDelete, 
  onSaveNotes, 
  showToast 
}) {
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, appId: null, companyName: '', isFromDetails: false });

  // Find active application if selectedAppId is provided
  const activeApp = applications.find(a => a.id === selectedAppId);

  // Sync notes when active application changes
  useEffect(() => {
    if (activeApp) {
      // Use requestAnimationFrame to avoid synchronous cascading render warning
      const id = requestAnimationFrame(() => {
        setNotes(activeApp.notes || '');
      });
      return () => cancelAnimationFrame(id);
    }
  }, [selectedAppId, activeApp]);

  const handleNotesSave = () => {
    if (activeApp) {
      onSaveNotes(activeApp.id, notes);
      showToast("Notes saved successfully!");
    }
  };

  const handleStatusChange = (e) => {
    if (activeApp) {
      onUpdateStatus(activeApp.id, e.target.value);
    }
  };

  const handleDeleteDetails = () => {
    if (activeApp) {
      setDeleteConfirm({
        isOpen: true,
        appId: activeApp.id,
        companyName: activeApp.company,
        isFromDetails: true
      });
    }
  };

  const handleDeleteList = (appId, companyName, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      appId,
      companyName,
      isFromDetails: false
    });
  };

  const selectApp = (appId) => {
    window.location.hash = `#id=${appId}`;
  };

  const navigateToList = () => {
    window.location.hash = '#/applications';
  };

  // Filter logic
  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch = !query || 
      app.company.toLowerCase().includes(query) ||
      app.role.toLowerCase().includes(query) ||
      (app.location && app.location.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Applied', value: 'Applied' },
    { label: 'Online Assessment', value: 'Screening' },
    { label: 'Interview', value: 'Interviewing' },
    { label: 'Selected', value: 'Offer' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  // Render Details View
  if (activeApp) {
    const avatarConfig = getCompanyAvatarConfig(activeApp.company);
    
    // Timeline steps
    const stages = [
      { key: "Offer", label: "Offer Received", desc: "Final offer terms and salary negotiation." },
      { key: "Interviewing", label: "Technical Interview", desc: "Live coding session with engineering team members." },
      { key: "Screening", label: "Online Assessment", desc: "Completed frontend and system design coding challenge." },
      { key: "Applied", label: "Application Submitted", desc: "Successfully applied online via company portal." }
    ];

    const statusMap = { "Applied": 0, "Screening": 1, "Interviewing": 2, "Offer": 3, "Rejected": -1 };
    const currentStageIndex = statusMap[activeApp.status] !== undefined ? statusMap[activeApp.status] : 0;
    const isRejectedStatus = activeApp.status === "Rejected";

    return (
      <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <button 
            onClick={navigateToList} 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
          >
            Applications
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">{activeApp.role}</span>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Info + Timeline */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Top overview card */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${avatarConfig.classes}`}>
                    {avatarConfig.char}
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{activeApp.company}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{activeApp.role}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex items-center">
                    <select 
                      value={activeApp.status} 
                      onChange={handleStatusChange}
                      className={`pl-4 pr-8 py-1.5 text-xs font-semibold rounded-full border-none cursor-pointer focus:ring-1 focus:ring-violet-500 font-body-sm bg-slate-100 dark:bg-slate-800 appearance-none ${getStatusBadgeClass(activeApp.status)}`}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Online Assessment</option>
                      <option value="Interviewing">Interview</option>
                      <option value="Offer">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[14px] opacity-80 font-bold">
                      expand_more
                    </span>
                  </div>
                  <button 
                    onClick={handleDeleteDetails}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors" 
                    title="Delete application"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{activeApp.location || "Not specified"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{activeApp.salary || "Not specified"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date Applied</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{formatDate(activeApp.date)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Link</span>
                  {activeApp.url ? (
                    <a 
                      href={activeApp.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5 mt-1"
                    >
                      View Posting <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  ) : activeApp.description ? (
                    <span className="text-sm font-semibold text-slate-500 mt-1">See text below</span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400 mt-1">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description card */}
            {activeApp.description && (
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Job Description</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">Core expectations and requirements from the company.</p>
                </div>
                <div className="text-sm font-normal text-slate-700 dark:text-slate-350 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 whitespace-pre-line">
                  {activeApp.description}
                </div>
              </div>
            )}

            {/* Timeline component */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Application Journey</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">Keep track of your interview progress and key milestones.</p>
              </div>

              <div className="relative pl-8 flex flex-col gap-8">
                {stages.map((stage, idx) => {
                  const stageIndex = 3 - idx;
                  let isCompleted = false;
                  let isActive = false;
                  let isRejected = false;

                  if (isRejectedStatus) {
                    isRejected = true;
                  } else if (stageIndex < currentStageIndex) {
                    isCompleted = true;
                  } else if (stageIndex === currentStageIndex) {
                    isActive = true;
                  }

                  let circleClass;
                  let checkIcon;

                  if (isCompleted) {
                    circleClass = "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-2 border-green-500";
                    checkIcon = <span className="material-symbols-outlined text-[16px] font-bold">check</span>;
                  } else if (isActive) {
                    circleClass = "bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-2 border-violet-600 ring-4 ring-violet-50 dark:ring-violet-950/40";
                    checkIcon = <span className="w-2.5 h-2.5 bg-violet-600 dark:bg-violet-400 rounded-full"></span>;
                  } else if (isRejected && idx === 0) {
                    circleClass = "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-500";
                    checkIcon = <span className="material-symbols-outlined text-[16px] font-bold">close</span>;
                  } else {
                    circleClass = "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700";
                    checkIcon = null;
                  }

                  return (
                    <div key={stage.key} className="relative flex gap-4 items-start">
                      {idx < stages.length - 1 && (
                        <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%+32px)] bg-slate-100 dark:bg-slate-800/80 z-0"></div>
                      )}
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${circleClass}`}>
                        {checkIcon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {isRejected && idx === 0 ? "Application Rejected" : stage.label}
                          </h5>
                          <span className="text-xs text-slate-400 font-semibold">
                            {idx === 3 ? formatDate(activeApp.date) : ""}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {isRejected && idx === 0 ? "Application was declined by the recruiter." : stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Recruiter Contact & Notes */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Recruiter Contact</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                  <span className="text-sm truncate font-medium">
                    {activeApp.recruiterEmail || `hr@${activeApp.company.toLowerCase().replace(/\s+/g, '')}.com`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">phone</span>
                  <span className="text-sm font-medium">
                    {activeApp.recruiterPhone || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Interview Notes</h4>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">edit_note</span>
              </div>
              <textarea 
                rows="8" 
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500" 
                placeholder="Type key questions, takeaways or checklists here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button 
                onClick={handleNotesSave}
                className="w-full py-2 btn-primary font-semibold text-sm transition-colors active:scale-[0.98]"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200">
            <div className="glass-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/95 dark:bg-slate-900/95 text-on-surface dark:text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-rose-500">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-bold">Delete Application</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Are you sure you want to delete your application for <span className="font-bold text-slate-900 dark:text-slate-100">{deleteConfirm.companyName}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: false, appId: null, companyName: '', isFromDetails: false })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onDelete(deleteConfirm.appId);
                    if (deleteConfirm.isFromDetails) {
                      window.location.hash = '#/applications';
                    }
                    setDeleteConfirm({ isOpen: false, appId: null, companyName: '', isFromDetails: false });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render List View
  return (
    <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">All Applications</h2>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your application journey stages.</p>
          <div className="relative w-full max-w-md mt-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">search</span>
            <input 
              id="apps-search" 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-body-sm text-body-sm transition-colors shadow-sm" 
              placeholder="Search companies, roles..." 
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => { window.location.hash = '#/add-new'; }} 
          className="flex items-center gap-2 btn-primary font-semibold transition-all shadow-sm cursor-pointer active:scale-95 text-sm py-2.5 px-5"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> New Application
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button 
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                isActive 
                  ? 'border-violet-500 bg-violet-50/50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-violet-400 dark:hover:border-violet-500'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Applications Table */}
      <div className="data-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Applied</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Salary</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">pageview</span>
                    <p className="font-semibold text-lg">No applications match the criteria</p>
                    <p className="text-xs mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const avatarConfig = getCompanyAvatarConfig(app.company);
                  const statusBadge = getStatusBadgeClass(app.status);
                  
                  // Display mapping matching HTML original
                  let displayStatus = app.status;
                  if (app.status === "Screening") displayStatus = "Online Assessment";
                  if (app.status === "Interviewing") displayStatus = "Interview";
                  if (app.status === "Offer") displayStatus = "Selected";

                  return (
                    <tr 
                      key={app.id} 
                      onClick={() => selectApp(app.id)}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover-row transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${avatarConfig.classes}`}>
                            {avatarConfig.char}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{app.company}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">{app.role}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(app.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{app.salary || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              selectApp(app.id);
                            }}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300"
                            title="View details"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteList(app.id, app.company, e)}
                            className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-300"
                            title="Delete application"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200">
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/95 dark:bg-slate-900/95 text-on-surface dark:text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-500">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-lg font-bold">Delete Application</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Are you sure you want to delete your application for <span className="font-bold text-slate-900 dark:text-slate-100">{deleteConfirm.companyName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, appId: null, companyName: '', isFromDetails: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onDelete(deleteConfirm.appId);
                  if (deleteConfirm.isFromDetails) {
                    window.location.hash = '#/applications';
                  }
                  setDeleteConfirm({ isOpen: false, appId: null, companyName: '', isFromDetails: false });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
