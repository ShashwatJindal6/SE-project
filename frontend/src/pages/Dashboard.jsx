import { useState } from 'react';
import { 
  getCompanyAvatarConfig, 
  getStatusBadgeClass, 
  formatDate 
} from '../utils/helpers';
import DetailsModal from '../components/DetailsModal';

function Dashboard({ applications, profile, onUpdateStatus, onDelete }) {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive Stats
  const totalApps = applications.length;
  
  // Calculate applications added in the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = applications.filter(app => {
    const appDate = new Date(app.date);
    return !isNaN(appDate) && appDate >= sevenDaysAgo;
  }).length;

  const screeningCount = applications.filter(a => a.status === 'Screening' || a.status === 'Online Assessment').length;
  const interviewingCount = applications.filter(a => a.status === 'Interviewing' || a.status === 'Interview').length;
  const offerCount = applications.filter(a => a.status === 'Offer' || a.status === 'Selected').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  // Active pipelines (anything not rejected)
  const activeCount = totalApps - rejectedCount;

  // Percentages
  const interviewPercent = totalApps > 0 ? Math.round((interviewingCount / totalApps) * 100) : 0;
  const offerPercent = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;

  // Active Pipeline Rate (percentage of active to total)
  const activeRate = totalApps > 0 ? Math.round((activeCount / totalApps) * 100) : 0;
  // Rejection Rate
  const rejectionRate = totalApps > 0 ? Math.round((rejectedCount / totalApps) * 100) : 0;

  // Funnel heights/widths based on percentages
  const funnelApplied = totalApps > 0 ? 100 : 0;
  const funnelScreening = totalApps > 0 ? Math.round(((screeningCount + interviewingCount + offerCount) / totalApps) * 100) : 0;
  const funnelInterviewing = totalApps > 0 ? Math.round(((interviewingCount + offerCount) / totalApps) * 100) : 0;
  const funnelOffer = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;

  // Get recent 5 applications (sorted by date descending)
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const openDetails = (id) => {
    setSelectedAppId(id);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelectedAppId(null);
  };

  // Helper for rendering progress ring
  const renderProgressRing = (percent, colorClass) => {
    const radius = 16;
    const circ = 2 * Math.PI * radius; // ~100.53
    const offset = circ - (percent / 100) * circ;

    return (
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-12 h-12">
          {/* Track */}
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            stroke="currentColor" 
            strokeWidth="3.5" 
            fill="transparent" 
            className="text-slate-100 dark:text-slate-800" 
          />
          {/* Indicator */}
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            stroke="currentColor" 
            strokeWidth="3.5" 
            fill="transparent" 
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={`${colorClass} circle-progress-ring`}
          />
        </svg>
        <span className="absolute text-[10px] font-bold">{percent}%</span>
      </div>
    );
  };

  // Get user's first name
  const firstName = (profile?.name || "Sarah").split(" ")[0];

  return (
    <>
      <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10">
      {/* Greeting Banner */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-3">
          <span className="shimmer-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-sunset-coral pulse-dot"></span>
            ACTIVE RECRUITING CYCLE
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-primary-text mt-2">
          Hello, {firstName}!
        </h2>
        <p className="text-muted-text">
          Here is your application pipeline overview. You have <span className="font-semibold text-sunset-coral">{activeCount} active</span> processes.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* Total Applications Card */}
        <div className="glass-card glass-card-glow-coral rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider">Total Applications</span>
            <span className="text-4xl font-extrabold text-primary-text">{totalApps}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +{thisWeekCount} this week
            </span>
          </div>
          <div className="stat-orb w-14 h-14 bg-sunset-coral/10 text-sunset-coral">
            <span className="material-symbols-outlined text-2xl">description</span>
          </div>
        </div>

        {/* Interviews Card */}
        <div className="glass-card glass-card-glow-pink rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider">Interviews Scheduled</span>
            <span className="text-4xl font-extrabold text-primary-text">{interviewingCount}</span>
            <span className="text-xs text-muted-text font-semibold flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[14px]">event</span>
              Upcoming coding/design rounds
            </span>
          </div>
          {renderProgressRing(interviewPercent, 'text-electric-pink')}
        </div>

        {/* Offers Card */}
        <div className="glass-card glass-card-glow-orange rounded-2xl p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider">Offers Received</span>
            <span className="text-4xl font-extrabold text-primary-text">{offerCount}</span>
            <span className="text-xs text-tangerine font-semibold flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
              Congratulations!
            </span>
          </div>
          {renderProgressRing(offerPercent, 'text-tangerine')}
        </div>
      </div>

      {/* Two Column Layout (Graph & Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-primary-text">Recent Applications</h3>
            <a href="#/applications" className="text-xs text-sunset-coral hover:text-electric-pink font-semibold flex items-center gap-0.5 transition-colors">
              View All <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
            </a>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(216,204,255,0.08)] text-[10px] uppercase font-bold text-muted-text tracking-wider">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Date Applied</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(216,204,255,0.06)]">
                {recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-muted-text text-sm">
                      No applications added yet. Click "Add Application" to get started!
                    </td>
                  </tr>
                ) : (
                  recentApplications.map((app) => {
                    const avatarConfig = getCompanyAvatarConfig(app.company);
                    return (
                      <tr 
                        key={app.id} 
                        onClick={() => openDetails(app.id)}
                        className="hover-row group cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${avatarConfig.classes}`}>
                            {avatarConfig.char}
                          </div>
                          <span className="font-semibold text-primary-text">{app.company}</span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-muted-text font-medium">
                          {app.role}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-text">
                          {formatDate(app.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(app.id);
                            }}
                            className="p-1 text-muted-text hover:text-sunset-coral rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funnel & Weekly Summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Funnel Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-primary-text">Application Funnel</h3>
            <div className="flex flex-col gap-3 py-1">
              {/* Applied Funnel Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-text">
                  <span>Applied</span>
                  <span>{totalApps} ({funnelApplied}%)</span>
                </div>
                <div className="funnel-bar-wrap h-2.5 w-full">
                  <div className="h-full bg-gradient-to-r from-sunset-coral to-electric-pink rounded-full" style={{ width: `${funnelApplied}%` }}></div>
                </div>
              </div>
              {/* Screening Funnel Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-text">
                  <span>Screening & OA</span>
                  <span>{screeningCount + interviewingCount + offerCount} ({funnelScreening}%)</span>
                </div>
                <div className="funnel-bar-wrap h-2.5 w-full">
                  <div className="h-full bg-gradient-to-r from-electric-pink to-brand-violet rounded-full" style={{ width: `${funnelScreening}%` }}></div>
                </div>
              </div>
              {/* Interviewing Funnel Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-text">
                  <span>Technical Interviews</span>
                  <span>{interviewingCount + offerCount} ({funnelInterviewing}%)</span>
                </div>
                <div className="funnel-bar-wrap h-2.5 w-full">
                  <div className="h-full bg-gradient-to-r from-brand-violet to-tangerine rounded-full" style={{ width: `${funnelInterviewing}%` }}></div>
                </div>
              </div>
              {/* Offer Funnel Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-text">
                  <span>Offers Received</span>
                  <span>{offerCount} ({funnelOffer}%)</span>
                </div>
                <div className="funnel-bar-wrap h-2.5 w-full">
                  <div className="h-full bg-gradient-to-r from-tangerine to-emerald-400 rounded-full" style={{ width: `${funnelOffer}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Summary Metrics */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-primary-text">Cycle Summary</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-[rgba(216,204,255,0.08)]">
                <div>
                  <h4 className="text-sm font-bold text-primary-text">Active Pipeline Rate</h4>
                  <p className="text-[10px] text-muted-text mt-0.5">Non-rejected active processes</p>
                </div>
                <span className="text-xl font-extrabold text-sunset-coral">{activeRate}%</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[rgba(216,204,255,0.08)]">
                <div>
                  <h4 className="text-sm font-bold text-primary-text">Rejection Ratio</h4>
                  <p className="text-[10px] text-muted-text mt-0.5">Percentage of files rejected</p>
                </div>
                <span className="text-xl font-extrabold text-red-400">{rejectionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-primary-text">Total Offers</h4>
                  <p className="text-[10px] text-muted-text mt-0.5">Successful job offerings</p>
                </div>
                <span className="text-xl font-extrabold text-emerald-400">{offerCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Details modal */}
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

export default Dashboard;
