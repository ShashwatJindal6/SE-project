// Helpers for AFTERGLOW application

export const DEFAULT_APPLICATIONS = [];

export function convertUsdToInr(usdSalary) {
    if (!usdSalary) return '';
    if (usdSalary.includes('₹') || usdSalary.includes('INR')) return usdSalary;
    
    const match = usdSalary.match(/^\$?([0-9,.]+)\s*(.*)$/);
    if (match) {
        const numericStr = match[1].replace(/,/g, '');
        const numVal = parseFloat(numericStr);
        const suffix = match[2] ? match[2].trim() : '';
        
        if (!isNaN(numVal)) {
            const inrVal = Math.round(numVal * 83);
            const formattedInr = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(inrVal);
            
            const suffixFormatted = suffix ? (suffix.startsWith('/') ? suffix : ' ' + suffix) : '';
            return `${formattedInr}${suffixFormatted}`;
        }
    }
    return usdSalary;
}

export function formatInrSalary(salaryStr) {
    if (!salaryStr) return '';
    if (salaryStr.includes('₹') || salaryStr.includes('INR')) return salaryStr;
    
    const match = salaryStr.trim().match(/^([0-9,.]+)\s*(.*)$/);
    if (match) {
        const numericStr = match[1].replace(/,/g, '');
        const numVal = parseFloat(numericStr);
        const suffix = match[2] ? match[2].trim() : '';
        
        if (!isNaN(numVal)) {
            const formattedInr = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(numVal);
            
            const suffixFormatted = suffix ? (suffix.startsWith('/') ? suffix : ' ' + suffix) : '';
            return `${formattedInr}${suffixFormatted}`;
        }
    }
    return salaryStr;
}

export function getApplications() {
    let apps = JSON.parse(localStorage.getItem("afterglow_applications") || localStorage.getItem("internflow_applications"));
    if (!apps) {
        apps = [...DEFAULT_APPLICATIONS];
        localStorage.setItem("afterglow_applications", JSON.stringify(apps));
    } else {
        // Migrate legacy applications from USD to INR
        let migrated = false;
        apps = apps.map(app => {
            if (app.salary && app.salary.startsWith('$')) {
                migrated = true;
                return { ...app, salary: convertUsdToInr(app.salary) };
            }
            return app;
        });
        localStorage.setItem("afterglow_applications", JSON.stringify(apps));
    }
    return apps;
}

export function saveApplications(apps) {
    localStorage.setItem("afterglow_applications", JSON.stringify(apps));
}

export function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toISOString().split('T')[0];
}

export function getCompanyAvatarConfig(companyName) {
    const val = (companyName || "A").trim().toUpperCase()[0];
    const colors = {
        'STRIPE': 'bg-[#635bff] text-white',
        'NOTION': 'bg-black text-white',
        'FIGMA': 'bg-[#f24e1e] text-white',
        'AIRBNB': 'bg-[#ff5a5f] text-white',
        'LINEAR': 'bg-[#5e6ad2] text-white',
        'VERCEL': 'bg-black text-white',
        'GITHUB': 'bg-[#24292e] text-white',
        'GOOGLE': 'bg-blue-600 text-white'
    };
    
    const compUpper = (companyName || "").toUpperCase();
    let bgClass = colors[compUpper];
    if (!bgClass) {
        const fallbackColors = {
            'G': 'bg-blue-600 text-white',
            'A': 'bg-slate-700 text-white',
            'M': 'bg-red-600 text-white',
            'N': 'bg-black text-white',
            'S': 'bg-emerald-600 text-white',
            'F': 'bg-orange-600 text-white',
            'H': 'bg-amber-600 text-white',
            'P': 'bg-sky-600 text-white'
        };
        bgClass = fallbackColors[val] || 'bg-blue-600 text-white';
    }

    return {
        char: val,
        classes: `${bgClass} rounded-lg`
    };
}

export function getStatusBadgeClass(status) {
    switch (status) {
        case 'Applied':
            return 'badge-applied';
        case 'Online Assessment':
        case 'Screening':
            return 'badge-screening';
        case 'Interviewing':
        case 'Interview':
            return 'badge-interviewing';
        case 'Offer':
        case 'Selected':
            return 'badge-offer';
        case 'Rejected':
            return 'badge-rejected';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700';
    }
}

export function getAppMilestones(app) {
    if (app.milestones && Array.isArray(app.milestones) && app.milestones.length > 0) {
        return app.milestones;
    }
    
    const statusMap = { "Applied": 0, "Screening": 1, "Interviewing": 2, "Offer": 3 };
    const currentIdx = statusMap[app.status] !== undefined ? statusMap[app.status] : 0;
    
    const milestones = [
        { key: "Applied", label: "Application Submitted", completed: true, date: app.date, notes: "Successfully applied online via company portal." },
        { key: "Screening", label: "Online Assessment", completed: currentIdx >= 1, date: currentIdx >= 1 ? app.date : "", notes: "Completed initial evaluation stage." },
        { key: "Interviewing", label: "Technical Interview", completed: currentIdx >= 2, date: currentIdx >= 2 ? app.date : "", notes: "Completed coding session with engineering team." },
        { key: "Offer", label: "Offer Received", completed: currentIdx >= 3, date: currentIdx >= 3 ? app.date : "", notes: "Final offer details and salary negotiation." }
    ];
    
    if (app.status === "Rejected") {
        milestones.forEach((m, idx) => {
            if (idx > currentIdx) m.completed = false;
        });
        milestones.unshift({ key: "Rejected", label: "Application Declined", completed: true, date: app.date, notes: app.notes || "Recruiter declined application." });
    }
    
    return milestones;
}

export const DEFAULT_NOTES = [];

export function getNotes() {
    let notes = JSON.parse(localStorage.getItem("afterglow_notes") || localStorage.getItem("careerpilot_notes"));
    if (!notes) {
        notes = [...DEFAULT_NOTES];
        localStorage.setItem("afterglow_notes", JSON.stringify(notes));
    }
    return notes;
}

export function saveNotes(notes) {
    localStorage.setItem("afterglow_notes", JSON.stringify(notes));
}
