import { useState, useEffect } from 'react';
import { 
  getCompanyAvatarConfig, 
  formatDate 
} from '../utils/helpers';

// Helper to parse salary details
const parseSalary = (salaryStr) => {
  if (!salaryStr) return { value: 0, period: 'unknown' };
  const cleanStr = salaryStr.toLowerCase();
  const cleanedDigits = cleanStr.replace(/[^\d]/g, '');
  const num = parseInt(cleanedDigits, 10);
  if (isNaN(num)) return { value: 0, period: 'unknown' };

  let period = 'hourly';
  if (cleanStr.includes('/mo') || cleanStr.includes('month') || cleanStr.includes('pm')) {
    period = 'monthly';
  } else if (cleanStr.includes('/yr') || cleanStr.includes('year') || cleanStr.includes('pa') || cleanStr.includes('/annum')) {
    period = 'yearly';
  }

  return { value: num, period };
};

// Skill alignment analysis
const analyzeSkillAlignment = (app, profileSkills = []) => {
  if (!app || !profileSkills || profileSkills.length === 0) {
    return { percent: 0, matched: [], missing: [], reasoning: 'No skills found to match.' };
  }

  const roleText = `${app.role} ${app.company} ${app.description || ''} ${app.notes || ''}`.toLowerCase();
  
  // Define synonymous/related keywords for profile skills to improve matching heuristics
  const skillSynonyms = {
    'figma': ['figma', 'sketch', 'adobe xd', 'design tool', 'ui design', 'ux design', 'prototype', 'prototyping', 'product design'],
    'wireframing': ['wireframe', 'wireframes', 'wireframing', 'lo-fi', 'layout', 'mockup', 'mockups', 'interface'],
    'prototyping': ['prototype', 'prototyping', 'interactive', 'interaction', 'figma', 'animation', 'flow', 'ux'],
    'user research': ['user research', 'interview', 'interviews', 'usability', 'user testing', 'persona', 'personas', 'feedback', 'user-centered'],
    'html/css': ['html', 'css', 'sass', 'tailwind', 'styling', 'frontend', 'front-end', 'flexbox', 'grid', 'web'],
    'react': ['react', 'next.js', 'nextjs', 'javascript', 'jsx', 'typescript', 'frontend', 'front-end', 'web'],
    'typescript': ['typescript', 'ts', 'javascript', 'js', 'typed'],
    'javascript': ['javascript', 'js', 'es6', 'web'],
    'node.js': ['node', 'nodejs', 'backend', 'express', 'apis', 'api', 'server'],
    'python': ['python', 'django', 'flask', 'pandas', 'numpy', 'data', 'backend'],
    'java': ['java', 'spring', 'springboot', 'oop', 'backend'],
    'c++': ['c++', 'cpp', 'algorithms', 'structures', 'leetcode'],
    'algorithms': ['algorithm', 'algorithms', 'data structures', 'problem solving', 'leetcode', 'graphs', 'trees']
  };

  const matched = [];
  const missing = [];

  profileSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    // Direct check
    let isMatch = roleText.includes(skillLower);
    
    // Synonym check
    if (!isMatch && skillSynonyms[skillLower]) {
      isMatch = skillSynonyms[skillLower].some(syn => roleText.includes(syn));
    }
    
    // Slanted compound skill check
    if (!isMatch && skillLower.includes('/')) {
      const parts = skillLower.split('/');
      isMatch = parts.some(part => roleText.includes(part.trim()));
    }

    if (isMatch) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const percent = profileSkills.length > 0 ? Math.round((matched.length / profileSkills.length) * 100) : 0;
  
  let reasoning = '';
  if (percent >= 80) {
    reasoning = `Matches ${percent}% of your listed skills. The role strongly aligns with your experience in ${matched.slice(0, 3).join(', ')}.`;
  } else if (percent >= 40) {
    reasoning = `Matches ${percent}% of your skills. Good coverage in ${matched.slice(0, 2).join(', ')}, though you may need to pick up other tools.`;
  } else if (percent > 0) {
    reasoning = `Aligns with ${percent}% of your profile. Focuses primarily on areas outside your listed skills, except for ${matched.join(', ')}.`;
  } else {
    reasoning = `No direct overlap detected with your listed skills. You may need to acquire new domain-specific tools for this role.`;
  }

  return { percent, matched, missing, reasoning };
};

// Generate AI Recommendation
const generateAIRecommendation = (app1, app2, profile, skillAnalysis1, skillAnalysis2) => {
  if (!app1 || !app2) return null;

  const scoreDetails = {
    app1: { salary: 0, location: 0, skill: skillAnalysis1.percent, total: 0 },
    app2: { salary: 0, location: 0, skill: skillAnalysis2.percent, total: 0 }
  };

  // Evaluate Salary
  const sal1 = parseSalary(app1.salary);
  const sal2 = parseSalary(app2.salary);
  
  const getMonthlyValue = (sal) => {
    if (sal.value === 0) return 0;
    if (sal.period === 'hourly') return sal.value * 160;
    if (sal.period === 'yearly') return sal.value / 12;
    return sal.value;
  };

  const monthly1 = getMonthlyValue(sal1);
  const monthly2 = getMonthlyValue(sal2);

  let betterSalaryApp = null;
  if (monthly1 > monthly2) {
    scoreDetails.app1.salary = 100;
    scoreDetails.app2.salary = monthly1 > 0 ? Math.round((monthly2 / monthly1) * 100) : 0;
    betterSalaryApp = 1;
  } else if (monthly2 > monthly1) {
    scoreDetails.app2.salary = 100;
    scoreDetails.app1.salary = monthly2 > 0 ? Math.round((monthly1 / monthly2) * 100) : 0;
    betterSalaryApp = 2;
  } else {
    scoreDetails.app1.salary = 100;
    scoreDetails.app2.salary = 100;
  }

  // Evaluate Location preference matching profile location
  const evalLocation = (appLocation, userLocation = '') => {
    const locLower = (appLocation || '').toLowerCase();
    const userLower = (userLocation || '').toLowerCase();
    
    if (locLower.includes('remote')) return 100;
    if (userLower && (locLower.includes(userLower) || userLower.includes(locLower))) return 90;
    return 60; // different city
  };

  const locScore1 = evalLocation(app1.location, profile?.location);
  const locScore2 = evalLocation(app2.location, profile?.location);

  scoreDetails.app1.location = locScore1;
  scoreDetails.app2.location = locScore2;

  let betterLocationApp = null;
  if (locScore1 > locScore2) betterLocationApp = 1;
  else if (locScore2 > locScore1) betterLocationApp = 2;

  // Calculate Overall Scores (weighted formula)
  const calcTotal = (details) => {
    return Math.round((details.skill * 0.40) + (details.salary * 0.45) + (details.location * 0.15));
  };

  scoreDetails.app1.total = calcTotal(scoreDetails.app1);
  scoreDetails.app2.total = calcTotal(scoreDetails.app2);

  const recommendedApp = scoreDetails.app1.total >= scoreDetails.app2.total ? 1 : 2;
  const recApp = recommendedApp === 1 ? app1 : app2;
  const otherApp = recommendedApp === 1 ? app2 : app1;

  // Build Pros and Cons
  const getProsAndCons = (app, other, sal, otherSal, skillAnalysis, locScore, otherLocScore) => {
    const pros = [];
    const cons = [];

    if (sal > otherSal && otherSal > 0) {
      pros.push(`Higher estimated compensation (${app.salary} vs ${other.salary})`);
    } else if (sal < otherSal && sal > 0) {
      cons.push(`Lower compensation rate than ${other.company}`);
    }

    if (app.location.toLowerCase().includes('remote')) {
      pros.push("Remote flexibility allows working from anywhere");
    } else if (locScore >= 90) {
      pros.push(`Local role in ${app.location} aligns with your profile location`);
    } else {
      cons.push(`Requires relocation or commute to ${app.location}`);
    }

    if (skillAnalysis.percent >= 70) {
      pros.push(`Excellent skill alignment (${skillAnalysis.percent}% overlap)`);
    } else if (skillAnalysis.percent < 40) {
      cons.push(`Relies on skills you haven't highlighted yet (${skillAnalysis.percent}% match)`);
    }

    const hasRecruiter = app.recruiterEmail || app.recruiterPhone;
    if (hasRecruiter) {
      pros.push("Direct recruiter contacts are logged");
    } else {
      cons.push("Missing recruiter phone/email listings");
    }

    // Heuristics to guarantee content density
    if (pros.length < 2) {
      pros.push(`Clear position parameters for ${app.role}`);
    }
    if (cons.length === 0) {
      cons.push("Requires adapting to company-specific tools and processes");
    }

    return { pros, cons };
  };

  const app1ProsCons = getProsAndCons(
    app1, app2, 
    monthly1, monthly2, 
    skillAnalysis1, 
    locScore1, locScore2
  );
  
  const app2ProsCons = getProsAndCons(
    app2, app1, 
    monthly2, monthly1, 
    skillAnalysis2, 
    locScore2, locScore1
  );

  // Confidence assessment
  let confidenceVal = 70;
  if (sal1.value > 0 && sal2.value > 0) confidenceVal += 10;
  if (app1.description && app2.description) confidenceVal += 10;
  if (profile?.skills?.length > 3) confidenceVal += 10;

  // Reasoning text
  const reasonFactors = [];
  const betterSkill = skillAnalysis1.percent > skillAnalysis2.percent ? 1 : (skillAnalysis2.percent > skillAnalysis1.percent ? 2 : null);
  const betterSalary = monthly1 > monthly2 ? 1 : (monthly2 > monthly1 ? 2 : null);
  const betterLoc = locScore1 > locScore2 ? 1 : (locScore2 > locScore1 ? 2 : null);

  const dominant = recommendedApp;
  if (betterSkill === dominant) reasonFactors.push("better skill alignment");
  if (betterSalary === dominant) reasonFactors.push("stronger compensation terms");
  if (betterLoc === dominant) reasonFactors.push("preferred location logistics");

  let summary = `Based on your profile skills and application details, ${dominant === 1 ? app1.company : app2.company} appears to be a stronger match. This is primarily driven by its `;
  if (reasonFactors.length > 0) {
    summary += reasonFactors.join(' and ') + '.';
  } else {
    summary += `overall balanced alignment with your skill set and competitive parameters.`;
  }

  return {
    recommendedApp,
    recommendedCompany: recApp.company,
    recommendedRole: recApp.role,
    otherCompany: otherApp.company,
    summary,
    confidence: confidenceVal,
    app1: { pros: app1ProsCons.pros, cons: app1ProsCons.cons, totalScore: scoreDetails.app1.total },
    app2: { pros: app2ProsCons.pros, cons: app2ProsCons.cons, totalScore: scoreDetails.app2.total }
  };
};

// Custom searchable select component
function SearchableSelect({ label, value, options, onChange, placeholder, uniqueId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(opt => opt.id === value);
  const filteredOptions = options.filter(opt =>
    opt.company.toLowerCase().includes(search.toLowerCase()) ||
    opt.role.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e) => {
      if (!e.target.closest(`.searchable-select-${uniqueId}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen, uniqueId]);

  return (
    <div className={`relative flex-1 searchable-select-${uniqueId}`}>
      <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 hover:border-violet-300 dark:hover:border-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-body-sm text-body-sm transition-all shadow-sm"
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{selectedOption.company}</span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold truncate max-w-[120px]">
              • {selectedOption.role}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
        <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 flex flex-col gap-2 max-h-[260px] overflow-hidden">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-grow flex flex-col gap-1 pr-1">
            {filteredOptions.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 text-xs text-center py-4">No offers match search</span>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                const avatarConfig = getCompanyAvatarConfig(opt.company);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? 'bg-violet-50/50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-350'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarConfig.classes}`}>
                        {avatarConfig.char}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{opt.company}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">{opt.role}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px] text-violet-550">check</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Compare({ applications = [], profile, showToast }) {
  // Filter for Offer / Selected / Accepted applications
  const acceptedApps = applications.filter(app => {
    const statusLower = (app.status || '').toLowerCase();
    return ['offer', 'selected', 'accepted'].includes(statusLower);
  });

  // Offer IDs selected
  const [offer1Id, setOffer1Id] = useState('');
  const [offer2Id, setOffer2Id] = useState('');

  // Default selection if accepted apps are available
  useEffect(() => {
    if (acceptedApps.length >= 2) {
      if (!offer1Id) setOffer1Id(acceptedApps[0].id);
      if (!offer2Id) setOffer2Id(acceptedApps[1].id);
    }
  }, [acceptedApps]);

  const app1 = acceptedApps.find(a => a.id === offer1Id);
  const app2 = acceptedApps.find(a => a.id === offer2Id);

  // Skill alignment analysis calculations
  const profileSkills = profile?.skills || ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'HTML/CSS'];
  const skillAnalysis1 = analyzeSkillAlignment(app1, profileSkills);
  const skillAnalysis2 = analyzeSkillAlignment(app2, profileSkills);

  // Recommendation engine calculations
  const recData = generateAIRecommendation(app1, app2, profile, skillAnalysis1, skillAnalysis2);

  // Highlighting heuristics helper
  const isBetterValue = (field, appNum) => {
    if (!app1 || !app2) return false;
    
    if (field === 'salary') {
      const sal1 = parseSalary(app1.salary);
      const sal2 = parseSalary(app2.salary);
      
      const getMonthlyValue = (sal) => {
        if (sal.value === 0) return 0;
        if (sal.period === 'hourly') return sal.value * 160;
        if (sal.period === 'yearly') return sal.value / 12;
        return sal.value;
      };

      const val1 = getMonthlyValue(sal1);
      const val2 = getMonthlyValue(sal2);

      if (val1 === val2) return false;
      return appNum === 1 ? val1 > val2 : val2 > val1;
    }

    if (field === 'skills') {
      if (skillAnalysis1.percent === skillAnalysis2.percent) return false;
      return appNum === 1 
        ? skillAnalysis1.percent > skillAnalysis2.percent 
        : skillAnalysis2.percent > skillAnalysis1.percent;
    }

    if (field === 'location') {
      // Prioritize remote, then matching profile location
      const userLoc = profile?.location || '';
      const locScore = (loc) => {
        const l = loc.toLowerCase();
        if (l.includes('remote')) return 2;
        if (userLoc && l.includes(userLoc.toLowerCase())) return 1;
        return 0;
      };
      const score1 = locScore(app1.location);
      const score2 = locScore(app2.location);
      if (score1 === score2) return false;
      return appNum === 1 ? score1 > score2 : score2 > score1;
    }

    return false;
  };

  // Render header
  const renderHeader = () => (
    <div className="flex flex-col gap-1 mb-2">
      <div className="flex items-center gap-3">
        <span className="shimmer-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 pulse-dot"></span>
          AI ANALYSIS MODULE
        </span>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
        AI Offer Comparison
      </h2>
      <p className="text-slate-500 dark:text-slate-400">
        Compare accepted internship offers using your application details and profile skills.
      </p>
    </div>
  );

  // Render empty state
  if (acceptedApps.length < 2) {
    return (
      <div className="p-8 flex-1 max-w-4xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
        {renderHeader()}

        <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-6 border border-slate-200 dark:border-slate-800 mt-4">
          <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">info</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Insufficient Accepted Offers</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md">
              Add more accepted applications and profile skills to generate AI-powered comparisons. Currently, you have <span className="font-semibold text-violet-600 dark:text-violet-400">{acceptedApps.length}</span> accepted offers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button 
              onClick={() => { window.location.hash = '#/board'; }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span> Go to Board
            </button>
            <button 
              onClick={() => { window.location.hash = '#/add-new'; }}
              className="px-5 py-2.5 btn-primary text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Offer
            </button>
            <button 
              onClick={() => { window.location.hash = '#/profile'; }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">person</span> Update Skills
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Avatar configs
  const avatar1 = app1 ? getCompanyAvatarConfig(app1.company) : null;
  const avatar2 = app2 ? getCompanyAvatarConfig(app2.company) : null;

  return (
    <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-6 page-fade-in relative z-10 text-on-surface dark:text-slate-100">
      {renderHeader()}

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-30">
        <div className="glass-card rounded-2xl p-5 relative z-20">
          <SearchableSelect 
            label="Select Offer 1" 
            value={offer1Id} 
            options={acceptedApps} 
            onChange={(id) => {
              if (id === offer2Id) {
                showToast("Please choose two different offers to compare", "info");
                return;
              }
              setOffer1Id(id);
            }} 
            placeholder="Choose Offer 1"
            uniqueId="offer-1"
          />
        </div>
        <div className="glass-card rounded-2xl p-5 relative z-10">
          <SearchableSelect 
            label="Select Offer 2" 
            value={offer2Id} 
            options={acceptedApps} 
            onChange={(id) => {
              if (id === offer1Id) {
                showToast("Please choose two different offers to compare", "info");
                return;
              }
              setOffer2Id(id);
            }} 
            placeholder="Choose Offer 2"
            uniqueId="offer-2"
          />
        </div>
      </div>

      {app1 && app2 ? (
        <>
          {/* Side by Side Comparison Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Offer 1 Card */}
            <div className={`glass-card rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 relative overflow-hidden ${
              recData.recommendedApp === 1 ? 'ring-2 ring-violet-500/50 dark:ring-violet-400/30' : ''
            }`}>
              {recData.recommendedApp === 1 && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-indigo-600 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Recommended Match
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${avatar1?.classes}`}>
                  {avatar1?.char}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">{app1.company}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{app1.role}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                {/* Details list */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Salary</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      isBetterValue('salary', 1) ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-700 dark:text-slate-200'
                    }`}>{app1.salary || "Not Specified"}</span>
                    {isBetterValue('salary', 1) && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Higher</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Location</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      isBetterValue('location', 1) ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                    }`}>{app1.location || "Remote"}</span>
                    {isBetterValue('location', 1) && (
                      <span className="text-[10px] bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold px-1.5 py-0.5 rounded">Preferred</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Date Applied</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{formatDate(app1.date)}</span>
                </div>

                <div className="flex flex-col gap-1.5 py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Recruiter Contact Details</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 text-xs">
                    {app1.recruiterEmail ? (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-slate-400">mail</span> {app1.recruiterEmail}</span>
                    ) : null}
                    {app1.recruiterPhone ? (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-slate-400">phone</span> {app1.recruiterPhone}</span>
                    ) : null}
                    {!app1.recruiterEmail && !app1.recruiterPhone ? (
                      <span className="text-slate-400 italic">None logged</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Skill Alignment Match</span>
                    <span className={`text-xs font-bold ${
                      isBetterValue('skills', 1) ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600'
                    }`}>{skillAnalysis1.percent}%</span>
                  </div>
                  <div className="funnel-bar-wrap h-2 w-full">
                    <div 
                      className={`h-full bg-gradient-to-r ${
                        isBetterValue('skills', 1) ? 'from-violet-600 to-indigo-500' : 'from-slate-400 to-slate-500 dark:from-slate-700 dark:to-slate-600'
                      } rounded-full transition-all duration-500`}
                      style={{ width: `${skillAnalysis1.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offer 2 Card */}
            <div className={`glass-card rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 relative overflow-hidden ${
              recData.recommendedApp === 2 ? 'ring-2 ring-violet-500/50 dark:ring-violet-400/30' : ''
            }`}>
              {recData.recommendedApp === 2 && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-indigo-600 text-white font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Recommended Match
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${avatar2?.classes}`}>
                  {avatar2?.char}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">{app2.company}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{app2.role}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                {/* Details list */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Salary</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      isBetterValue('salary', 2) ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-700 dark:text-slate-200'
                    }`}>{app2.salary || "Not Specified"}</span>
                    {isBetterValue('salary', 2) && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Higher</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Location</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      isBetterValue('location', 2) ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                    }`}>{app2.location || "Remote"}</span>
                    {isBetterValue('location', 2) && (
                      <span className="text-[10px] bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 font-bold px-1.5 py-0.5 rounded">Preferred</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Date Applied</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{formatDate(app2.date)}</span>
                </div>

                <div className="flex flex-col gap-1.5 py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Recruiter Contact Details</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400 text-xs">
                    {app2.recruiterEmail ? (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-slate-400">mail</span> {app2.recruiterEmail}</span>
                    ) : null}
                    {app2.recruiterPhone ? (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-slate-400">phone</span> {app2.recruiterPhone}</span>
                    ) : null}
                    {!app2.recruiterEmail && !app2.recruiterPhone ? (
                      <span className="text-slate-400 italic">None logged</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 py-1 border-t border-slate-100/50 dark:border-slate-800/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Skill Alignment Match</span>
                    <span className={`text-xs font-bold ${
                      isBetterValue('skills', 2) ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600'
                    }`}>{skillAnalysis2.percent}%</span>
                  </div>
                  <div className="funnel-bar-wrap h-2 w-full">
                    <div 
                      className={`h-full bg-gradient-to-r ${
                        isBetterValue('skills', 2) ? 'from-violet-600 to-indigo-500' : 'from-slate-400 to-slate-500 dark:from-slate-700 dark:to-slate-600'
                      } rounded-full transition-all duration-500`}
                      style={{ width: `${skillAnalysis2.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Skill Match Analysis Details */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-violet-500">psychology</span>
              AI Skill Match Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              {/* Offer 1 skills */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${avatar1?.classes}`}>
                    {avatar1?.char}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{app1.company}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Heuristic profile analysis</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  “{skillAnalysis1.reasoning}”
                </p>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matching Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillAnalysis1.matched.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No matching profile skills identified</span>
                    ) : (
                      skillAnalysis1.matched.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/10">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                {skillAnalysis1.missing.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Missing Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillAnalysis1.missing.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Offer 2 skills */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${avatar2?.classes}`}>
                    {avatar2?.char}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{app2.company}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Heuristic profile analysis</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  “{skillAnalysis2.reasoning}”
                </p>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matching Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skillAnalysis2.matched.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No matching profile skills identified</span>
                    ) : (
                      skillAnalysis2.matched.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-500/10">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                {skillAnalysis2.missing.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Missing Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillAnalysis2.missing.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendation Panel */}
          {recData && (
            <div className="glass-card rounded-2xl p-6 border-2 border-violet-500/20 dark:border-violet-500/30 flex flex-col gap-5 bg-gradient-to-br from-white/90 to-violet-50/20 dark:from-slate-900/90 dark:to-violet-950/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-violet-500">auto_awesome</span>
                  AI Recommendation
                </h3>
                
                {/* Confidence Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">AI Confidence:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${recData.confidence}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{recData.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Recommendation summary text */}
              <div className="p-4 bg-violet-500/5 dark:bg-violet-400/5 rounded-xl border border-violet-500/10 dark:border-violet-400/10 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {recData.summary}
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {/* Offer 1 Pros & Cons */}
                <div className="flex flex-col gap-4 p-4 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Evaluation: {app1.company}
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Pros</span>
                      <ul className="flex flex-col gap-1.5">
                        {recData.app1.pros.map((pro, index) => (
                          <li key={index} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">add_circle</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Cons</span>
                      <ul className="flex flex-col gap-1.5">
                        {recData.app1.cons.map((con, index) => (
                          <li key={index} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-rose-400 shrink-0">remove_circle</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Offer 2 Pros & Cons */}
                <div className="flex flex-col gap-4 p-4 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Evaluation: {app2.company}
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Pros</span>
                      <ul className="flex flex-col gap-1.5">
                        {recData.app2.pros.map((pro, index) => (
                          <li key={index} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">add_circle</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Cons</span>
                      <ul className="flex flex-col gap-1.5">
                        {recData.app2.cons.map((con, index) => (
                          <li key={index} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[16px] text-rose-400 shrink-0">remove_circle</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default Compare;
