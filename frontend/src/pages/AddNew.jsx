import { useState } from 'react';
import { formatInrSalary } from '../utils/helpers';
import { API_BASE_URL } from '../config';

function AddNew({ onAdd, showToast, userEmail }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('Applied');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedSalary = formatInrSalary(salary.trim());

    const newApp = {
      userEmail: userEmail || '',
      company: company.trim(),
      role: role.trim(),
      status: status,
      date: date,
      location: location.trim() || 'Remote',
      salary: formattedSalary,
      description: description.trim(),
      recruiterEmail: recruiterEmail.trim(),
      recruiterPhone: recruiterPhone.trim(),
      url: '',
      notes: notes.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/add-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newApp)
      });

      if (!response.ok) {
        throw new Error('Failed to save application to the database');
      }

      const savedApp = await response.json();
      
      // Keep frontend compatibility by using _id as the id
      const appWithId = {
        ...savedApp,
        id: savedApp._id || Date.now().toString()
      };

      onAdd(appWithId);
      showToast(`Added ${appWithId.company} application successfully!`);

      // Redirect to dashboard after 1s
      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 1000);
    } catch (error) {
      console.error("Error saving application:", error);
      showToast("Error adding application to database", "error");
    }
  };

  return (
    <div className="p-container-padding flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center items-center gap-8 page-fade-in py-12 text-on-surface dark:text-slate-100 relative z-10">
      <div className="max-w-3xl w-full">
        <div className="mb-8 text-left">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">New Application</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track a new opportunity by entering the details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="form-company" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">corporate_fare</span>
                <input
                  id="form-company"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                  placeholder="e.g. Google"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="form-role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role/Position</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">work</span>
                <input
                  id="form-role"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                  placeholder="e.g. UX Designer Intern"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="form-location" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                <input
                  id="form-location"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                  placeholder="e.g. Remote or San Francisco, CA"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="form-salary" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estimated Salary (₹ INR)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">currency_rupee</span>
                <input
                  id="form-salary"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                  placeholder="e.g. 3,500/hr or 6,00,000/yr"
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              {salary && (
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Formatted: {formatInrSalary(salary)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="form-status" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Status</label>
              <div className="relative">
                <select
                  id="form-status"
                  required
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm appearance-none cursor-pointer"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Applied">Applied</option>
                  <option value="Online Assessment">Online Assessment</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Selected (Offer)</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="form-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date Applied</label>
              <input
                id="form-date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="form-description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Description</label>
            <textarea
              id="form-description"
              rows="3"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm"
              placeholder="What are they expecting? (e.g. React proficiency, UI design experience...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="gradient-divider"></div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-violet-500">contact_page</span>
              Recruiter Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="form-recruiter-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recruiter Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                  <input
                    id="form-recruiter-email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                    placeholder="e.g. recruiter@company.com"
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="form-recruiter-phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recruiter Phone</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">phone</span>
                  <input
                    id="form-recruiter-phone"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
                    placeholder="e.g. +91 98765 43210"
                    type="text"
                    value={recruiterPhone}
                    onChange={(e) => setRecruiterPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="gradient-divider"></div>

          <div>
            <label htmlFor="form-notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
            <textarea
              id="form-notes"
              rows="4"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm"
              placeholder="Any specific requirements, recruiter names, or personal thoughts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <button
              id="form-cancel-btn"
              type="button"
              onClick={() => { window.location.hash = '#/dashboard'; }}
              className="text-violet-600 hover:text-violet-700 dark:text-violet-455 dark:hover:text-violet-400 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 btn-primary font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddNew;
