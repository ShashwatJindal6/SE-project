import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getNotes, saveNotes, getCompanyAvatarConfig, formatDate } from '../utils/helpers';
import { API_BASE_URL } from '../config';

// Helper function to convert markdown-like syntax to React HTML
const renderMarkdown = (text) => {
  if (!text) return '';
  
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet points starting with - or *
  formatted = formatted.replace(/^(?:-|\*)\s+(.*)$/gm, '<li class="ml-5 list-disc my-1">$1</li>');
  
  // Wrap lists
  formatted = formatted.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-2 text-slate-600 dark:text-slate-300 font-medium">$1</ul>');

  // Inline code: `code`
  formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-mono text-[11px] font-semibold">$1</code>');

  // Newlines to br
  formatted = formatted.replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
};

function Notes({ applications = [], onSaveNotes, showToast, userEmail }) {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [companyFilter, setCompanyFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, helpful, views
  
  // Card Expansion states
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Active Revison Mode states
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionIndex, setRevisionIndex] = useState(0);
  const [flashcardSide, setFlashcardSide] = useState('question'); // question, answer
  const [revisionTimer, setRevisionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);
  
  // Image lightbox state
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Voice Recording simulation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingNoteId, setRecordingNoteId] = useState(null);
  const recordingIntervalRef = useRef(null);

  // Form states for Add/Edit Note
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formRound, setFormRound] = useState('Technical');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formStatus, setFormStatus] = useState('Waiting');
  const [formSkills, setFormSkills] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formQuestions, setFormQuestions] = useState('');
  const [formTips, setFormTips] = useState('');
  const [formMistakes, setFormMistakes] = useState('');
  const [formConfidence, setFormConfidence] = useState(3);
  const [formAttachments, setFormAttachments] = useState([]);
  
  const fileInputRef = useRef(null);
  const formFileInputRef = useRef(null);

  useEffect(() => {
    if (userEmail) {
      fetch(`${API_BASE_URL}/api/notes/get-notes?email=${encodeURIComponent(userEmail)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch notes');
          return res.json();
        })
        .then((data) => {
          const mappedData = data.map(n => ({
            ...n,
            id: n._id || n.id
          }));
          setNotes(mappedData);
        })
        .catch((err) => {
          console.error("Error loading notes:", err);
          showToast("Error loading notes from database", "error");
        });
    } else {
      setNotes([]);
    }
  }, [userEmail]);

  // Save app notes metadata in local storage
  useEffect(() => {
    const appOnly = notes.filter(n => n.isFromApplication || n.id.startsWith('app-note-'));
    const appMeta = {};
    appOnly.forEach(n => {
      const appId = n.appId || n.id.replace('app-note-', '');
      appMeta[appId] = {
        starred: n.starred,
        confidence: n.confidence,
        views: n.views,
        helpful: n.helpful,
        voiceNote: n.voiceNote,
        attachments: n.attachments
      };
    });
    localStorage.setItem('careerpilot_app_notes_meta', JSON.stringify(appMeta));
  }, [notes]);

  // Sync notes from applications into the notes state
  useEffect(() => {
    if (!applications) return;
    
    let appMeta = {};
    try {
      const stored = localStorage.getItem('careerpilot_app_notes_meta');
      if (stored) appMeta = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }

    setNotes(prevNotes => {
      const appNotes = applications
        .filter(app => app.notes && app.notes.trim() !== '')
        .map(app => {
          const meta = appMeta[app.id] || {};
          const existing = prevNotes.find(n => n.id === `app-note-${app.id}` || n.appId === app.id);
          
          if (existing) {
            return {
              ...existing,
              company: app.company,
              role: app.role,
              date: app.date,
              notes: app.notes,
              status: app.status === 'Offer' || app.status === 'Selected' ? 'Selected' : (app.status === 'Rejected' ? 'Rejected' : 'Waiting'),
              round: existing.round || (app.status === 'Screening' || app.status === 'Online Assessment' ? 'OA' : (app.status === 'Interviewing' || app.status === 'Interview' ? 'Technical' : 'General')),
              starred: existing.starred !== undefined ? existing.starred : (meta.starred || false),
              confidence: existing.confidence !== undefined ? existing.confidence : (meta.confidence || 3),
              views: existing.views !== undefined ? existing.views : (meta.views || 0),
              helpful: existing.helpful !== undefined ? existing.helpful : (meta.helpful || 0),
              voiceNote: existing.voiceNote !== undefined ? existing.voiceNote : (meta.voiceNote || null),
              attachments: existing.attachments !== undefined ? existing.attachments : (meta.attachments || [])
            };
          } else {
            return {
              id: `app-note-${app.id}`,
              appId: app.id,
              company: app.company,
              role: app.role,
              round: app.status === 'Screening' || app.status === 'Online Assessment' ? 'OA' : (app.status === 'Interviewing' || app.status === 'Interview' ? 'Technical' : 'General'),
              date: app.date,
              difficulty: 'Medium',
              status: app.status === 'Offer' || app.status === 'Selected' ? 'Selected' : (app.status === 'Rejected' ? 'Rejected' : 'Waiting'),
              skills: ['App Notes'],
              notes: app.notes,
              questions: '',
              tips: '',
              mistakes: '',
              starred: meta.starred || false,
              confidence: meta.confidence || 3,
              views: meta.views || 0,
              helpful: meta.helpful || 0,
              voiceNote: meta.voiceNote || null,
              attachments: meta.attachments || [],
              isFromApplication: true
            };
          }
        });

      const filteredPrev = prevNotes.filter(n => {
        if (n.isFromApplication || n.id.startsWith('app-note-')) {
          const appId = n.appId || n.id.replace('app-note-', '');
          const app = applications.find(a => a.id === appId);
          return app && app.notes && app.notes.trim() !== '';
        }
        return true;
      });

      const finalNotes = [...filteredPrev];
      appNotes.forEach(an => {
        const index = finalNotes.findIndex(n => n.id === an.id);
        if (index > -1) {
          finalNotes[index] = an;
        } else {
          finalNotes.push(an);
        }
      });

      return finalNotes;
    });
  }, [applications]);

  // Handle Revision Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setRevisionTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Formats time in mm:ss format
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle card expansion and increment view count
  const toggleExpandNote = (id) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Increment views count for sorting/analytics
      setNotes(prevNotes => 
        prevNotes.map(n => n.id === id ? { ...n, views: (n.views || 0) + 1 } : n)
      );
    }
    setExpandedNotes(newExpanded);
  };

  // Toggle Favorite/Star status
  const toggleStar = async (id, e) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const nextStarred = !note.starred;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/update-note/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ starred: nextStarred })
      });

      if (!response.ok) throw new Error('Failed to star note');

      setNotes(prevNotes => 
        prevNotes.map(n => n.id === id ? { ...n, starred: nextStarred } : n)
      );
      showToast(nextStarred ? "Bookmarked experience!" : "Removed bookmark", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle helpful/upvote button
  const handleHelpfulIncrement = async (id, e) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const nextHelpful = (note.helpful || 0) + 1;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/update-note/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful: nextHelpful })
      });

      if (!response.ok) throw new Error('Failed to increment helpful count');

      setNotes(prevNotes => 
        prevNotes.map(n => n.id === id ? { ...n, helpful: nextHelpful } : n)
      );
      showToast("Marked note as helpful!", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete note handler
  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this interview note?")) {
      const targetNote = notes.find(n => n.id === id);
      if (targetNote) {
        const isAppNote = targetNote.isFromApplication || targetNote.id.startsWith('app-note-');
        const appId = targetNote.appId || (isAppNote ? targetNote.id.replace('app-note-', '') : null);
        if (isAppNote && appId && onSaveNotes) {
          onSaveNotes(appId, '');
        }
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/notes/delete-note/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete note');

        setNotes(prev => prev.filter(n => n.id !== id));
        showToast("Note deleted successfully", "error");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete note from database", "error");
      }
    }
  };

  // Voice note simulation: starts recording
  const startVoiceRecording = (noteId, e) => {
    e.stopPropagation();
    if (isRecording) return;
    setIsRecording(true);
    setRecordingNoteId(noteId);
    setRecordingSeconds(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  // Voice note simulation: stops recording and stores a mock transcription
  const stopVoiceRecording = async (e) => {
    e.stopPropagation();
    if (!isRecording) return;
    clearInterval(recordingIntervalRef.current);
    
    const transcripts = [
      "I discussed scaling high throughput microservices. Interviewer asked about database indexing, caching strategies using Redis, and partition keys.",
      "The coding round went well. Completed graph travel using BFS and explained time complexity. Interviewer gave feedback on variable naming.",
      "HR interview covered career goals, project ownership, and situational questions about resolving conflict inside technical teams.",
      "We spent 15 minutes reviewing React 19 features including Server Actions, useActionState, and optimization of virtual rendering."
    ];
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    const voiceNoteData = {
      duration: formatTime(recordingSeconds),
      transcription: randomTranscript
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/update-note/${recordingNoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voiceNote: voiceNoteData })
      });

      if (!response.ok) throw new Error('Failed to save voice note');

      setNotes(prevNotes => 
        prevNotes.map(n => {
          if (n.id === recordingNoteId) {
            return {
              ...n,
              voiceNote: voiceNoteData
            };
          }
          return n;
        })
      );
      
      setIsRecording(false);
      setRecordingNoteId(null);
      showToast("Voice experience recorded and transcribed!", "success");
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setRecordingNoteId(null);
    }
  };

  // File attachments simulation (Base64 conversion)
  const triggerFileAttachment = (noteId, e) => {
    e.stopPropagation();
    setSelectedNote(notes.find(n => n.id === noteId));
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedNote) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const nextAttachments = [...(selectedNote.attachments || []), { name: file.name, url: dataUrl }];

      try {
        const response = await fetch(`${API_BASE_URL}/api/notes/update-note/${selectedNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ attachments: nextAttachments })
        });

        if (!response.ok) throw new Error('Failed to upload attachment');

        setNotes(prevNotes => 
          prevNotes.map(n => n.id === selectedNote.id ? { ...n, attachments: nextAttachments } : n)
        );
        showToast(`Attached ${file.name} successfully!`, "success");
        setSelectedNote(null);
      } catch (err) {
        console.error(err);
        showToast("Failed to upload attachment to database", "error");
        setSelectedNote(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Form file changes for Add/Edit dialogs
  const handleFormFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormAttachments(prev => [...prev, { name: file.name, url: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Reset form inputs
  const resetForm = () => {
    setFormCompany('');
    setFormRole('');
    setFormRound('Technical');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormDifficulty('Medium');
    setFormStatus('Waiting');
    setFormSkills('');
    setFormNotes('');
    setFormQuestions('');
    setFormTips('');
    setFormMistakes('');
    setFormConfidence(3);
    setFormAttachments([]);
    setSelectedNote(null);
  };

  // Open Edit Dialog and pre-populate fields
  const openEditDialog = (note, e) => {
    e.stopPropagation();
    setSelectedNote(note);
    setFormCompany(note.company);
    setFormRole(note.role);
    setFormRound(note.round);
    setFormDate(note.date);
    setFormDifficulty(note.difficulty);
    setFormStatus(note.status);
    setFormSkills(note.skills.join(', '));
    setFormNotes(note.notes);
    setFormQuestions(note.questions);
    setFormTips(note.tips);
    setFormMistakes(note.mistakes);
    setFormConfidence(note.confidence || 3);
    setFormAttachments(note.attachments || []);
    setIsEditModalOpen(true);
  };

  // Submit new note
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    const skillsArray = formSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newNoteData = {
      userEmail: userEmail || '',
      company: formCompany.trim(),
      role: formRole.trim(),
      round: formRound,
      date: formDate,
      difficulty: formDifficulty,
      status: formStatus,
      skills: skillsArray,
      notes: formNotes.trim(),
      questions: formQuestions.trim(),
      tips: formTips.trim(),
      mistakes: formMistakes.trim(),
      starred: false,
      confidence: parseInt(formConfidence),
      views: 0,
      helpful: 0,
      voiceNote: null,
      attachments: formAttachments
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/add-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNoteData)
      });

      if (!response.ok) throw new Error('Failed to save note');
      
      const savedNote = await response.json();
      const mappedNote = {
        ...savedNote,
        id: savedNote._id || savedNote.id
      };

      setNotes(prev => [mappedNote, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      showToast("Added new interview note!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save note to database", "error");
    }
  };

  // Submit edited note
  const handleEditNoteSubmit = async (e) => {
    e.preventDefault();
    const skillsArray = formSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const isAppNote = selectedNote.isFromApplication || selectedNote.id.startsWith('app-note-');
    const appId = selectedNote.appId || (isAppNote ? selectedNote.id.replace('app-note-', '') : null);

    if (isAppNote && appId && onSaveNotes) {
      onSaveNotes(appId, formNotes.trim());
    }

    const updatedData = {
      company: formCompany.trim(),
      role: formRole.trim(),
      round: formRound,
      date: formDate,
      difficulty: formDifficulty,
      status: formStatus,
      skills: skillsArray,
      notes: formNotes.trim(),
      questions: formQuestions.trim(),
      tips: formTips.trim(),
      mistakes: formMistakes.trim(),
      confidence: parseInt(formConfidence),
      attachments: formAttachments
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/update-note/${selectedNote.id || selectedNote._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update note');

      const savedNote = await response.json();
      const mappedNote = {
        ...savedNote,
        id: savedNote._id || savedNote.id
      };

      setNotes(prev => 
        prev.map(n => n.id === selectedNote.id ? mappedNote : n)
      );

      setIsEditModalOpen(false);
      resetForm();
      showToast("Updated interview note details!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update note in database", "error");
    }
  };

  // Triggering the revision study mode
  const openRevisionMode = () => {
    if (filteredNotes.length === 0) {
      showToast("No notes match the current filters to revise.", "error");
      return;
    }
    setRevisionIndex(0);
    setFlashcardSide('question');
    setRevisionTimer(0);
    setIsTimerRunning(true);
    setIsRevisionOpen(true);
  };

  const closeRevisionMode = () => {
    setIsRevisionOpen(false);
    setIsTimerRunning(false);
  };

  // Deriving lists of distinct filters from active notes
  const distinctCompanies = Array.from(new Set(notes.map(n => n.company))).sort();
  const distinctRounds = ['Technical', 'HR', 'OA', 'Managerial'];
  const distinctDifficulties = ['Easy', 'Medium', 'Hard'];
  const distinctStatuses = ['Selected', 'Rejected', 'Waiting'];

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.questions.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCompany = !companyFilter || note.company === companyFilter;
    const matchesRound = !roundFilter || note.round === roundFilter;
    const matchesDifficulty = !difficultyFilter || note.difficulty === difficultyFilter;
    const matchesStatus = !statusFilter || note.status === statusFilter;
    
    return matchesSearch && matchesCompany && matchesRound && matchesDifficulty && matchesStatus;
  });

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'helpful') {
      return (b.helpful || 0) - (a.helpful || 0);
    } else if (sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

  // Derive Bento stats/widgets metadata
  const totalQuestions = notes.reduce((acc, note) => {
    const list = note.questions.split('\n').filter(q => q.trim().length > 0);
    return acc + list.length;
  }, 0);

  // Frequently used skills aggregation
  const skillCounts = {};
  notes.forEach(note => {
    note.skills.forEach(skill => {
      const s = skill.trim();
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });
  const frequentSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top companies stats
  const companyCounts = {};
  notes.forEach(note => {
    companyCounts[note.company] = (companyCounts[note.company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Upcoming revisions (notes with waiting/screening statuses)
  const upcomingRevisions = notes.filter(n => n.status === 'Waiting').slice(0, 3);

  // Extract a flat list of most asked questions (limit to 3 for bento widgets)
  const flatQuestions = [];
  notes.forEach(note => {
    const qList = note.questions.split('\n').filter(q => q.trim().length > 0);
    qList.forEach(q => {
      // clean numbering like 1. or 2.
      const cleanedQ = q.replace(/^\d+[\.\s\-]+/g, '').trim();
      if (cleanedQ) {
        flatQuestions.push({ question: cleanedQ, company: note.company, role: note.role });
      }
    });
  });
  const displayedQuestions = flatQuestions.slice(0, 3);

  return (
    <>
      <div className="p-8 flex-1 max-w-6xl w-full mx-auto flex flex-col gap-8 page-fade-in relative z-10 text-slate-800 dark:text-slate-200">
        
        {/* Hidden inputs for attachments */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,application/pdf"
          className="hidden" 
        />

        {/* ── HEADER SECTION ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Interview Notes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm md:text-base font-medium">
              Quickly revisit experiences, questions, and tips before your next interview.
            </p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3 btn-primary text-sm font-semibold rounded-xl transition-all shadow-md self-start"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add New Note
          </button>
        </div>

        {/* ── SMART FEATURES BENTO GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bento Card 2: Skill Clouds and Top Companies */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500">terminal</span>
                Frequently Used Skills
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {frequentSkills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills cataloged yet.</span>
                ) : (
                  frequentSkills.map(([skill, count]) => (
                    <span 
                      key={skill}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:scale-105 transition-all cursor-default"
                    >
                      {skill} <span className="opacity-60 font-semibold">({count})</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-cyan-500">corporate_fare</span>
                Top Companies Applied
              </h3>
              <div className="mt-3.5 space-y-2">
                {topCompanies.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No companies recorded.</span>
                ) : (
                  (() => {
                    const maxCount = Math.max(...topCompanies.map(c => c[1]));
                    return topCompanies.map(([company, count]) => {
                      const avatar = getCompanyAvatarConfig(company);
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div 
                          key={company} 
                          className="group flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 hover:border-cyan-500/25 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 text-[11px] font-extrabold flex items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-105 ${avatar.classes}`}>
                              {avatar.char}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{company}</span>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{count} {count === 1 ? 'interview round' : 'interview rounds'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1.5 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-0.5 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Bento Card 3: Upcoming Revisions & Most Asked Questions */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-500">question_answer</span>
                Most Asked Questions
              </h3>
              <div className="mt-3 space-y-2">
                {displayedQuestions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No questions saved yet.</p>
                ) : (
                  displayedQuestions.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-violet-500/20 transition-all">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">"{item.question}"</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-semibold">
                        <span>{item.company}</span>
                        <span>{item.role}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-500">history</span>
                Upcoming Revision Focus
              </h3>
              <div className="mt-2.5 space-y-1.5">
                {upcomingRevisions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No upcoming review items. Add a note with 'Waiting' status.</p>
                ) : (
                  upcomingRevisions.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.company}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px]">{item.role}</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">{item.round}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── FILTERS AND SORTING CONTROLS ── */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, companies, skills, questions..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-body-sm text-body-sm transition-all"
              />
            </div>
            
            {/* Sorting options */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort By:</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 font-semibold text-xs appearance-none cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="views">Frequently Viewed</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Filtering selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
            {/* Company Filter */}
            <div className="relative">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="">All Companies</option>
                {distinctCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">expand_more</span>
            </div>

            {/* Round Filter */}
            <div className="relative">
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="">All Rounds</option>
                {distinctRounds.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">expand_more</span>
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="">All Difficulties</option>
                {distinctDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">expand_more</span>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {distinctStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* ── NOTES CARDS / MAIN SECTION ── */}
        <div className="flex flex-col gap-6">
          {sortedNotes.length === 0 ? (
            /* EMPTY STATE DESIGN */
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-6 py-16">
              <svg className="w-48 h-48 text-violet-200 dark:text-violet-900/40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.1" />
                <rect x="65" y="55" width="70" height="90" rx="8" stroke="currentColor" strokeWidth="4" fill="none" />
                <line x1="80" y1="80" x2="120" y2="80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="80" y1="100" x2="120" y2="100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="80" y1="120" x2="105" y2="120" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <circle cx="140" cy="140" r="25" fill="currentColor" fillOpacity="0.2" />
                <path d="M135 140L139 144L147 136" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Build your preparation vault</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-2 mx-auto leading-relaxed">
                  Start saving interview experiences, questions, and notes to create your personal preparation playbook.
                </p>
              </div>
              <button 
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                + Add First Interview Note
              </button>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const avatar = getCompanyAvatarConfig(note.company);
              const isExpanded = expandedNotes.has(note.id);
              
              // Difficulty tag styling
              let diffBadgeClass = "bg-green-500/10 text-green-600 dark:text-green-400";
              if (note.difficulty === "Medium") {
                diffBadgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
              } else if (note.difficulty === "Hard") {
                diffBadgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
              }

              // Status tag styling
              let statusBadgeClass = "bg-slate-500/10 text-slate-600 dark:text-slate-400";
              if (note.status === "Selected") {
                statusBadgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
              } else if (note.status === "Rejected") {
                statusBadgeClass = "bg-red-500/10 text-red-600 dark:text-red-400";
              }

              // Star filled/unfilled
              const starIcon = note.starred ? "star" : "star_rate";
              const starFillSettings = note.starred ? "'FILL' 1" : undefined;

              return (
                <div 
                  key={note.id}
                  onClick={() => toggleExpandNote(note.id)}
                  className={`glass-card rounded-2xl p-6 flex flex-col gap-4 border transition-all cursor-pointer ${
                    isExpanded ? 'border-violet-500/25 ring-1 ring-violet-500/10 shadow-md' : 'border-slate-100 dark:border-slate-800 hover:border-violet-500/15'
                  }`}
                >
                  
                  {/* Card Top / Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder */}
                      <div className={`w-12 h-12 text-lg font-bold flex items-center justify-center shadow-inner ${avatar.classes}`}>
                        {avatar.char}
                      </div>
                      
                      {/* Title Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">{note.company}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${diffBadgeClass}`}>
                            {note.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{note.role}</p>
                      </div>
                    </div>

                    {/* Controls/Action Buttons */}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => toggleStar(note.id, e)}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          note.starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                        }`}
                        title="Star/Favorite experience"
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: starFillSettings }}>{starIcon}</span>
                      </button>
                      <button 
                        onClick={(e) => openEditDialog(note, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        title="Edit Note"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Note"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Badges / Round / Date / Status */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
                    <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-lg">
                      {note.round} Round
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg ${statusBadgeClass}`}>
                      {note.status}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                      {formatDate(note.date)}
                    </span>
                    
                    {/* Stats */}
                    <div className="ml-auto text-slate-400/80 font-semibold flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        {note.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                        {note.helpful || 0}
                      </span>
                    </div>
                  </div>

                  {/* Skills / Tags used */}
                  <div className="flex flex-wrap gap-1.5">
                    {note.skills.map((skill) => (
                      <span 
                        key={skill}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400"
                      >
                        #{skill}
                      </span>
                    ))}
                  </div>

                  {/* Confidence rating (mood) */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Preparation Mood:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const isFilled = level <= (note.confidence || 3);
                        return (
                          <span 
                            key={level} 
                            className={`material-symbols-outlined text-[13px] ${
                              isFilled ? 'text-violet-500' : 'text-slate-300 dark:text-slate-700'
                            }`}
                            style={{ fontVariationSettings: isFilled ? "'FILL' 1" : undefined }}
                          >
                            sentiment_satisfied
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expandable Preview Section */}
                  {!isExpanded ? (
                    <div className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 border-t border-slate-50 dark:border-slate-800/40 pt-3 leading-relaxed mt-1">
                      {note.notes}
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-5 mt-1 transition-all stagger-children">
                      
                      {/* Summary Notes (Markdown) */}
                      <div>
                        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                          <span className="material-symbols-outlined text-[14px]">sticky_note_2</span>
                          Interview Experience Notes
                        </h4>
                        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          {renderMarkdown(note.notes)}
                        </div>
                      </div>

                      {/* Common questions asked */}
                      {note.questions && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-[14px] text-amber-500">question_answer</span>
                            Common Questions Asked
                          </h4>
                          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            {renderMarkdown(note.questions)}
                          </div>
                        </div>
                      )}

                      {/* Tips for future interviews */}
                      {note.tips && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-[14px] text-violet-500">lightbulb</span>
                            Tips & Keys to Remember
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic pl-3 border-l-2 border-violet-500">
                            {note.tips}
                          </p>
                        </div>
                      )}

                      {/* Mistakes to avoid */}
                      {note.mistakes && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-[14px] text-red-500">warning</span>
                            Mistakes to Avoid
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic pl-3 border-l-2 border-red-500">
                            {note.mistakes}
                          </p>
                        </div>
                      )}

                      {/* ── MOCK VOICE RECORDINGS & ATTACHMENTS ── */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60" onClick={e => e.stopPropagation()}>
                        
                        {/* Audio / Voice experience section */}
                        <div className="flex items-center gap-3">
                          {note.voiceNote ? (
                            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="material-symbols-outlined text-[18px] text-violet-600 dark:text-violet-400">play_circle</span>
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-700 dark:text-slate-350">Voice Reflection ({note.voiceNote.duration})</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1 truncate max-w-[200px]">{note.voiceNote.transcription}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isRecording && recordingNoteId === note.id ? (
                                <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900/50">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                                  <span className="text-xs font-bold text-red-600 font-mono">{formatTime(recordingSeconds)}</span>
                                  {/* Waveform simulation */}
                                  <div className="flex items-end gap-0.5 h-3">
                                    <div className="w-0.5 h-full bg-red-500 animate-[bounce_0.8s_infinite]"></div>
                                    <div className="w-0.5 h-2/3 bg-red-500 animate-[bounce_0.5s_infinite_0.1s]"></div>
                                    <div className="w-0.5 h-full bg-red-500 animate-[bounce_0.6s_infinite_0.2s]"></div>
                                    <div className="w-0.5 h-1/2 bg-red-500 animate-[bounce_0.7s_infinite_0.3s]"></div>
                                  </div>
                                  <button 
                                    onClick={stopVoiceRecording}
                                    className="text-[11px] font-extrabold uppercase tracking-wide bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded shadow"
                                  >
                                    Stop
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => startVoiceRecording(note.id, e)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">mic</span>
                                  Record Reflection
                                </button>
                              )}
                            </div>
                          )}

                          {/* Screenshot attachment button */}
                          <button 
                            onClick={(e) => triggerFileAttachment(note.id, e)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                            Attach Image/PDF
                          </button>
                        </div>

                        {/* Interactive upvote / useful button */}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => handleHelpfulIncrement(note.id, e)}
                            className="flex items-center gap-1.5 text-[11px] font-extrabold text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 px-3.5 py-1.5 rounded-xl border border-violet-500/20 transition-all hover:scale-105"
                          >
                            <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                            Mark Helpful
                          </button>
                        </div>

                      </div>

                      {/* Display attachments grid */}
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mt-2" onClick={e => e.stopPropagation()}>
                          {note.attachments.map((file, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => setLightboxImage(file)}
                              className="group relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm cursor-pointer hover:border-violet-500/30 transition-all"
                              title={file.name}
                            >
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── IMAGE LIGHTBOX DIALOG ── */}
      {lightboxImage && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-8"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2">
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 flex items-center justify-center transition-colors shadow-lg z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img 
              src={lightboxImage.url} 
              alt={lightboxImage.name} 
              className="max-w-full max-h-[75vh] object-contain rounded-lg" 
            />
            <p className="text-white text-xs font-semibold tracking-wide py-2 text-center truncate max-w-lg mt-1">{lightboxImage.name}</p>
          </div>
        </div>,
        document.body
      )}

      {/* ── ADD NEW NOTE MODAL ── */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 modal-glass max-h-[92vh] overflow-y-auto page-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-violet-500">sticky_note_2</span>
                Add Interview Note
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="flex flex-col gap-5">
              
              {/* Company & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Company Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Google, Stripe"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Position Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Frontend Engineer Intern"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              </div>

              {/* Round & Date & Difficulty & Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Round *</label>
                  <select
                    value={formRound}
                    onChange={(e) => setFormRound(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR</option>
                    <option value="OA">OA (Online Assessment)</option>
                    <option value="Managerial">Managerial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Date *</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Difficulty *</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Skills / Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Algorithms, System Design"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              {/* Textareas */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Interview Experience Notes * (supports Markdown style: **bold**, `code`, - bullets)</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Summarize the round, structure, and what they looked for..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Common Questions Asked (one per line, supports Markdown style)</label>
                <textarea
                  rows="2"
                  placeholder="- How would you optimize React lists?&#10;- Explain idempotency."
                  value={formQuestions}
                  onChange={(e) => setFormQuestions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tips for Future Interviews</label>
                  <textarea
                    rows="2"
                    placeholder="Tips, keys to focus on..."
                    value={formTips}
                    onChange={(e) => setFormTips(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Mistakes to Avoid</label>
                  <textarea
                    rows="2"
                    placeholder="What would you do differently next time?"
                    value={formMistakes}
                    onChange={(e) => setFormMistakes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>

              {/* Confidence (Slider) & Attachment upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Preparation confidence: {formConfidence}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Attach Files (Screenshots/Images)</label>
                  <input
                    type="file"
                    ref={formFileInputRef}
                    onChange={handleFormFileChange}
                    multiple
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-950/20 file:text-violet-600 dark:file:text-violet-400 hover:file:bg-violet-100 cursor-pointer"
                  />
                  {formAttachments.length > 0 && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {formAttachments.length} image(s) attached.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 btn-primary text-xs font-bold rounded-xl"
                >
                  Save Note
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT EXISTING NOTE MODAL ── */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 modal-glass max-h-[92vh] overflow-y-auto page-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-violet-500">edit_note</span>
                Edit Note Details
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditNoteSubmit} className="flex flex-col gap-5">
              
              {/* Company & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Company Name *</label>
                  <input
                    required
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Position Title *</label>
                  <input
                    required
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              </div>

              {/* Round & Date & Difficulty & Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Round *</label>
                  <select
                    value={formRound}
                    onChange={(e) => setFormRound(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR</option>
                    <option value="OA">OA (Online Assessment)</option>
                    <option value="Managerial">Managerial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Date *</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Difficulty *</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-semibold appearance-none"
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Skills / Tags (comma separated)</label>
                <input
                  type="text"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              {/* Textareas */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Interview Experience Notes *</label>
                <textarea
                  required
                  rows="3"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Common Questions Asked</label>
                <textarea
                  rows="2"
                  value={formQuestions}
                  onChange={(e) => setFormQuestions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tips for Future Interviews</label>
                  <textarea
                    rows="2"
                    value={formTips}
                    onChange={(e) => setFormTips(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Mistakes to Avoid</label>
                  <textarea
                    rows="2"
                    value={formMistakes}
                    onChange={(e) => setFormMistakes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>

              {/* Confidence (Slider) & Attachments view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Preparation confidence: {formConfidence}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(e.target.value)}
                    className="w-full accent-violet-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Attach More Screenshots/Images</label>
                  <input
                    type="file"
                    onChange={handleFormFileChange}
                    multiple
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-950/20 file:text-violet-600 dark:file:text-violet-400 hover:file:bg-violet-100 cursor-pointer"
                  />
                  {formAttachments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-emerald-600 font-bold">{formAttachments.length} attached.</span>
                      <button 
                        type="button" 
                        onClick={() => setFormAttachments([])}
                        className="text-[9px] font-extrabold text-red-500 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 btn-primary text-xs font-bold rounded-xl"
                >
                  Update Details
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── QUICK REVISION MODE DIALOG (Side Panel / Distraction-free Modal) ── */}
      {isRevisionOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 dark:bg-black/95 backdrop-blur-md overflow-hidden animate-fade-in">
          
          <div className="w-full h-full md:h-[85vh] md:max-w-4xl bg-white dark:bg-slate-900 rounded-none md:rounded-3xl shadow-2xl border-0 md:border border-slate-150 dark:border-slate-800/80 flex flex-col justify-between overflow-hidden relative">
            
            {/* Top Close bar & Timer */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <span className="shimmer-badge px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-bold">
                  FOCUS REVISION MODE
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[15px] animate-spin text-violet-500">timer</span>
                  <span className="font-mono">{formatTime(revisionTimer)}</span>
                </div>
              </div>
              <button 
                onClick={closeRevisionMode}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Exit Revision Mode"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Progress indicator bar */}
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all duration-300 shadow-md"
                style={{ width: `${((revisionIndex + 1) / filteredNotes.length) * 100}%` }}
              ></div>
            </div>

            {/* Flashcard Area / Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-start">
              
              {(() => {
                const currentNoteItem = filteredNotes[revisionIndex];
                if (!currentNoteItem) return null;
                const avatar = getCompanyAvatarConfig(currentNoteItem.company);
                
                // Parse questions list for flashcard rendering
                const questionList = currentNoteItem.questions
                  .split('\n')
                  .map(q => q.replace(/^\d+[\.\s\-]+/g, '').trim())
                  .filter(q => q.length > 0);

                return (
                  <div className="w-full max-w-lg flex flex-col gap-6 items-center my-auto py-4">
                    
                    {/* Header info for current card */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 font-bold flex items-center justify-center rounded text-xs ${avatar.classes}`}>
                        {avatar.char}
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-extrabold text-slate-455 dark:text-slate-400">{currentNoteItem.company} • {currentNoteItem.round} Round</span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currentNoteItem.role}</h4>
                      </div>
                    </div>

                    {/* Interactive Flashcard with Flip style behavior */}
                    <div 
                      onClick={() => setFlashcardSide(prev => prev === 'question' ? 'answer' : 'question')}
                      className={`w-full min-h-[260px] md:min-h-[300px] rounded-2xl p-6 md:p-8 border shadow-lg flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 relative ${
                        flashcardSide === 'question' 
                          ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-violet-500/20 hover:shadow-violet-500/5'
                          : 'bg-gradient-to-br from-violet-600/5 via-blue-600/5 to-transparent border-violet-500/25 shadow-violet-500/10'
                      }`}
                    >
                      <span className="absolute top-3.5 right-4 text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">{flashcardSide === 'question' ? 'flip' : 'check_circle'}</span>
                        {flashcardSide === 'question' ? 'Click to flip' : 'Correct Response'}
                      </span>

                      {flashcardSide === 'question' ? (
                        /* FRONT OF FLASHCARD: Questions */
                        <div className="flex flex-col items-center gap-4 w-full">
                          <span className="material-symbols-outlined text-3xl text-amber-500 animate-bounce">quiz</span>
                          <div className="text-left w-full">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 text-center">Interview Questions Asked:</p>
                            {questionList.length === 0 ? (
                              <p className="text-sm text-center text-slate-500 italic">No specific questions saved. Flip to view notes.</p>
                            ) : (
                              <div className="overflow-y-auto max-h-[160px] md:max-h-[200px] pr-1.5 scrollbar-thin">
                                <ul className="space-y-2">
                                  {questionList.map((q, idx) => (
                                    <li key={idx} className="text-xs md:text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                                      <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
                                      <span>{q}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* BACK OF FLASHCARD: Experience details / summary answer */
                        <div className="flex flex-col items-center gap-3 w-full text-left">
                          <span className="material-symbols-outlined text-3xl text-violet-500 self-center">verified</span>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 self-center">Preparation Notes & Answers:</p>
                          <div className="text-xs md:text-sm text-slate-700 dark:text-slate-350 w-full overflow-y-auto max-h-[160px] md:max-h-[220px] bg-white/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed pr-1.5 scrollbar-thin">
                            {renderMarkdown(currentNoteItem.notes)}
                            {currentNoteItem.tips && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                                <span className="font-extrabold text-[10px] text-violet-600 dark:text-violet-400 uppercase tracking-wider block mb-1">Key revision tip:</span>
                                <p className="italic text-slate-500 dark:text-slate-455 font-semibold">"{currentNoteItem.tips}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Card {revisionIndex + 1} of {filteredNotes.length}
                    </p>

                  </div>
                );
              })()}

            </div>

            {/* Bottom Navigation controls */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <button
                disabled={revisionIndex === 0}
                onClick={() => { setRevisionIndex(prev => Math.max(0, prev - 1)); setFlashcardSide('question'); }}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Previous
              </button>

              <button
                onClick={() => setIsTimerRunning(prev => !prev)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isTimerRunning 
                    ? 'border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600'
                    : 'border-green-200 bg-green-50 dark:bg-green-950/20 text-green-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{isTimerRunning ? 'pause' : 'play_arrow'}</span>
                {isTimerRunning ? 'Pause Revision' : 'Resume Revision'}
              </button>

              {revisionIndex === filteredNotes.length - 1 ? (
                <button
                  onClick={closeRevisionMode}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Finish Study
                </button>
              ) : (
                <button
                  onClick={() => { setRevisionIndex(prev => Math.min(filteredNotes.length - 1, prev + 1)); setFlashcardSide('question'); }}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20"
                >
                  Next
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>

          </div>

        </div>,
        document.body
      )}

    </>
  );
}

export default Notes;
