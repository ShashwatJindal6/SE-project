// Re-exports from applicationService for backward compatibility.
// All utility functions and data are defined in ../services/applicationService.js
export {
    DEFAULT_APPLICATIONS,
    DEFAULT_NOTES,
    convertUsdToInr,
    formatInrSalary,
    getApplications,
    saveApplications,
    formatDate,
    getCompanyAvatarConfig,
    getStatusBadgeClass,
    getAppMilestones,
    getNotes,
    saveNotes
} from '../services/applicationService';
