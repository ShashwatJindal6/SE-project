import { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';

function Profile({ profile, onUpdateProfile, showToast, onSignOut }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const skills = profile?.skills || [];
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be under 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const updated = {
          ...profile,
          resume: {
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
            uploadedAt: new Date().toLocaleDateString(),
            dataUrl: reader.result
          }
        };
        onUpdateProfile(updated);
        showToast("Resume uploaded successfully!");
      };
      reader.onerror = () => {
        showToast("Error reading file", "error");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewResume = () => {
    if (profile?.resume?.dataUrl) {
      const link = document.createElement("a");
      link.href = profile.resume.dataUrl;
      link.download = profile.resume.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast("No resume file data available", "error");
    }
  };

  const handleDeleteResume = () => {
    const updated = {
      ...profile,
      resume: null
    };
    onUpdateProfile(updated);
    showToast("Resume removed", "info");
  };

  // Edit Modal Form States
  const [editName, setEditName] = useState(profile?.name || '');
  const [editRole, setEditRole] = useState(profile?.role || '');
  const [editEmail, setEditEmail] = useState(profile?.email || '');
  const [editLocation, setEditLocation] = useState(profile?.location || '');
  const [editEducation, setEditEducation] = useState(profile?.education || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar || '');

  const openModal = () => {
    setEditName(profile?.name || '');
    setEditRole(profile?.role || '');
    setEditEmail(profile?.email || '');
    setEditLocation(profile?.location || '');
    setEditEducation(profile?.education || '');
    setEditAvatar(profile?.avatar || '');
    setIsModalOpen(true);
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editName.trim(),
      role: editRole.trim(),
      email: editEmail.trim(),
      location: editLocation.trim(),
      education: editEducation.trim(),
      avatar: editAvatar.trim()
    };
    onUpdateProfile(updated);
    setIsModalOpen(false);
    showToast("Profile details updated!");
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const updatedSkills = [...skills, trimmed];
      onUpdateProfile({ ...profile, skills: updatedSkills });
      setNewSkill('');
      setShowSkillInput(false);
      showToast(`Added skill: ${trimmed}`);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    onUpdateProfile({ ...profile, skills: updatedSkills });
    showToast(`Removed skill: ${skillToRemove}`, 'info');
  };

  return (
    <>
      <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">My Profile</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your personal information, resume, and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar card & Skills */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
            {/* Top Banner */}
            <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
            {/* Profile Content */}
            <div className="px-6 pb-6 flex flex-col items-center text-center">
              <div className="relative -mt-12 mb-4">
                <div 
                  id="profile-card-avatar"
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-violet-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-md cursor-default select-none animate-fade-in"
                >
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={openModal} 
                  className="absolute bottom-0 right-0 p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>
              <h3 id="profile-card-name" className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                {profile?.name || "Not specified"}
              </h3>
              <p id="profile-card-role" className="text-sm font-semibold text-violet-600 dark:text-violet-400 mt-1">
                {profile?.role || "Not specified"}
              </p>
              
              <div className="w-full border-t border-slate-100 dark:border-slate-800/60 my-4 pt-4 flex flex-col gap-3 text-left">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                  <span id="profile-card-location" className="text-sm">{profile?.location || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">school</span>
                  <span id="profile-card-education" className="text-sm font-medium">{profile?.education || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                  <span id="profile-card-email" className="text-sm truncate">{profile?.email || "Not specified"}</span>
                </div>
              </div>
              
              <button 
                onClick={openModal} 
                className="w-full py-2 border border-violet-100 dark:border-slate-800/85 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-800/40 font-semibold rounded-lg text-sm transition-colors active:scale-[0.98]"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Skills Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Skills</h4>
              <button 
                onClick={() => setShowSkillInput(!showSkillInput)}
                className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>

            {showSkillInput && (
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)} 
                  placeholder="Enter skill tag" 
                  className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg">Add</button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span 
                  key={skill}
                  className="group px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-lg text-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-1"
                >
                  {skill}
                  <button 
                    onClick={() => handleRemoveSkill(skill)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity ml-1 flex items-center justify-center"
                    title="Remove Skill"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
              <button 
                onClick={() => setShowSkillInput(true)}
                className="px-3 py-1.5 border border-dashed border-slate-200 dark:border-slate-850 text-slate-400 rounded-lg text-sm hover:border-violet-500 hover:text-violet-500 dark:hover:border-violet-400 dark:hover:text-violet-400 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Add Skill
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Resume & Settings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Resume Management */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Resume Management</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Upload and manage your primary resume for applications.</p>
              </div>
            </div>
            
            {profile?.resume ? (
              /* Resume File list item */
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded">PDF</span>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{profile.resume.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Uploaded {profile.resume.uploadedAt} • {profile.resume.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleViewResume}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Download/View Resume"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button 
                    onClick={handleDeleteResume}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete Resume"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Box */
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-400 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/20 dark:bg-slate-900/20"
              >
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, Word Document up to 5MB</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.doc,.docx" 
              className="hidden" 
            />
          </div>

          {/* Account Settings */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
            <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Account Settings</h4>
            
            <div className="flex flex-col gap-5">
              {/* Password Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">Password</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update your password to keep your account secure.</p>
                </div>
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-semibold text-sm cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Delete Account Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently remove your account and all associated data.</p>
                </div>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold text-sm cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5">
              <button 
                id="profile-sign-out-btn"
                onClick={() => { if (onSignOut) onSignOut(); }}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:text-red-400 font-semibold text-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="modal-glass rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800 mx-4 max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95">
            <div className="flex justify-between items-center mb-4 text-on-surface dark:text-slate-100">
              <h3 className="text-xl font-bold">Edit Profile Information</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-450 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveDetails} className="flex flex-col gap-4 text-slate-800 dark:text-slate-100">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input 
                  id="edit-name" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Title</label>
                <input 
                  id="edit-role" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input 
                  id="edit-email" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-location" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <input 
                  id="edit-location" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-education" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Education</label>
                <input 
                  id="edit-education" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="text"
                  value={editEducation}
                  onChange={(e) => setEditEducation(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-avatar-url" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Avatar Image URL</label>
                <input 
                  id="edit-avatar-url" 
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-body-sm text-body-sm" 
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 btn-primary rounded-lg text-white font-semibold transition-colors shadow-sm active:scale-95 text-sm"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-8 transform scale-100 transition-all duration-300 animate-scale-in text-left overflow-hidden">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500"></div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Update Password</h3>
                <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mt-0.5">Secure Your Account</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const currentPassword = formData.get("currentPassword");
                const newPassword = formData.get("newPassword");
                const confirmPassword = formData.get("confirmPassword");

                if (newPassword !== confirmPassword) {
                  showToast("New passwords do not match", "error");
                  return;
                }

                try {
                  const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      email: profile?.email,
                      currentPassword,
                      newPassword
                    })
                  });

                  const data = await response.json();
                  if (!response.ok) {
                    throw new Error(data.error || "Failed to update password");
                  }

                  showToast("Password updated successfully!", "success");
                  setIsPasswordModalOpen(false);
                } catch (err) {
                  showToast(err.message, "error");
                }
              }}
              className="flex flex-col gap-4 text-slate-800 dark:text-slate-100 text-left"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1.5">Current Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-slate-400 dark:text-slate-500 pointer-events-none">lock</span>
                  <input 
                    name="currentPassword"
                    required
                    type="password"
                    className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 font-body-sm text-body-sm transition-all" 
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 mb-1.5">New Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-slate-400 dark:text-slate-500 pointer-events-none">lock_open</span>
                  <input 
                    name="newPassword"
                    required
                    type="password"
                    className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 font-body-sm text-body-sm transition-all" 
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 mb-1.5">Confirm New Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-slate-400 dark:text-slate-500 pointer-events-none">gpp_maybe</span>
                  <input 
                    name="confirmPassword"
                    required
                    type="password"
                    className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 font-body-sm text-body-sm transition-all" 
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-850 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 text-xs cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-8 overflow-hidden">
            {/* Red accent top line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"></div>

            {/* Icon + Title */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shadow-sm border border-red-100 dark:border-red-900/40">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Delete Account</h3>
                <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest mt-0.5">Irreversible Action</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Warning message */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 mb-6">
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                <span className="font-bold">This action cannot be undone.</span> All your applications, notes, and profile data will be permanently deleted from our servers.
              </p>
            </div>

            {/* Confirm email field */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Type your email to confirm
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-slate-400 dark:text-slate-500 pointer-events-none">mail</span>
                <input
                  id="delete-confirm-email"
                  type="email"
                  placeholder={profile?.email || "your@email.com"}
                  className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-sm transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const input = document.getElementById("delete-confirm-email");
                  if (!input || input.value.trim() !== profile?.email) {
                    showToast("Email does not match. Please try again.", "error");
                    return;
                  }
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/users/delete-account`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: profile?.email })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to delete account");
                    showToast("Account deleted successfully.", "success");
                    setIsDeleteModalOpen(false);
                    setTimeout(() => { if (onSignOut) onSignOut(); }, 1200);
                  } catch (err) {
                    showToast(err.message, "error");
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 text-xs cursor-pointer"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
