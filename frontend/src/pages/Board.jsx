import { useState } from 'react';
import { 
  getCompanyAvatarConfig, 
  getStatusBadgeClass, 
  formatDate 
} from '../utils/helpers';
import DetailsModal from '../components/DetailsModal';

function Board({ applications, onUpdateStatus, onDelete, showToast }) {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedOverCol, setDraggedOverCol] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    { key: 'Applied', title: 'Applied', colorClass: 'bg-violet-500' },
    { key: 'Screening', title: 'Screening', colorClass: 'bg-blue-500' },
    { key: 'Interviewing', title: 'Interviewing', colorClass: 'bg-amber-500' },
    { key: 'Offer', title: 'Offer', colorClass: 'bg-emerald-500' }
  ];

  // Drag Handlers
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
    // Add dragging style helper
    e.currentTarget.classList.add('dragging-card-style');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging-card-style');
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    setDraggedOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const appId = e.dataTransfer.getData('text/plain');
    if (appId) {
      const app = applications.find(a => a.id === appId);
      if (app && app.status !== colKey) {
        onUpdateStatus(appId, colKey);
        showToast(`Moved ${app.company} to ${colKey}`);
      }
    }
  };

  const openDetails = (id) => {
    setSelectedAppId(id);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelectedAppId(null);
  };

  return (
    <>
      <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Kanban Board</h2>
        <p className="text-slate-500 dark:text-slate-400">Drag and drop applications between columns to update their stage.</p>
        <div className="relative w-full max-w-md mt-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">search</span>
          <input 
            id="board-search" 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-body-sm text-body-sm transition-colors shadow-sm" 
            placeholder="Search companies, roles..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        {columns.map((col) => {
          const filteredApps = applications.filter(app => {
            const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
            return !query || 
              app.company.toLowerCase().includes(query) ||
              app.role.toLowerCase().includes(query) ||
              (app.location && app.location.toLowerCase().includes(query));
          });

          const colApps = filteredApps.filter(app => {
            if (col.key === 'Screening') {
              return app.status === 'Screening' || app.status === 'Online Assessment';
            }
            if (col.key === 'Interviewing') {
              return app.status === 'Interviewing' || app.status === 'Interview';
            }
            if (col.key === 'Offer') {
              return app.status === 'Offer' || app.status === 'Selected';
            }
            return app.status === col.key;
          });

          const isOver = draggedOverCol === col.key;

          return (
            <div 
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`kanban-col flex flex-col p-4 gap-4 rounded-2xl min-h-[250px] transition-all duration-200 ${
                isOver ? 'dragover-glow ring-2 ring-violet-500' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.colorClass}`}></span>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{col.title}</span>
                </div>
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold">
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 flex-grow overflow-y-auto pt-2 pb-2 px-1">
                {colApps.map((app) => {
                  const avatarConfig = getCompanyAvatarConfig(app.company);
                  return (
                    <div 
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openDetails(app.id)}
                      className="kanban-card p-4 flex flex-col gap-3 cursor-grab transition-all bg-white/95 dark:bg-slate-900/95"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${avatarConfig.classes}`}>
                            {avatarConfig.char}
                          </div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-250 truncate max-w-[100px]">{app.company}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(app.status)}`}>
                          {app.status === 'Screening' ? 'OA' : (app.status === 'Interviewing' ? 'Interview' : (app.status === 'Offer' ? 'Selected' : app.status))}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{app.role}</h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {formatDate(app.date)}
                        </p>
                      </div>

                      {app.salary && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-500 font-semibold">
                          <span>Est. Salary:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{app.salary}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {colApps.length === 0 && (
                  <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-400 text-xs text-center font-medium">
                    Drag applications here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      </div>

      {/* Details Modal */}
      <DetailsModal 
        isOpen={isModalOpen}
        appId={selectedAppId}
        applications={applications}
        onClose={closeDetails}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
      />
    </>
  );
}

export default Board;
