// ============================
// Dashboard.jsx — Fixed Navigation Issues
// ============================

import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5050/api";
const getUserId = () => parseInt(sessionStorage.getItem("userId") || "9", 10);
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "X-User-Id": getUserId(),
});

// ---- Animation Hook ----
const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
  const ref = React.useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.triggerOnce) {
          observer.unobserve(entry.target);
        }
      } else if (!options.triggerOnce) {
        setInView(false);
      }
    }, options);

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options.threshold, options.triggerOnce]);

  return [ref, inView];
};

// ---- Enhanced UI Classes ----
const hoverLift = "transition duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-violet-300 border-2 border-transparent";
const cardBorder = "border-2 border-black shadow-lg";
const sectionBorder = "border-b-2 border-black";

// ---- Geometric Background Pattern ----
const BackgroundPattern = () => (
  <div className="absolute inset-0 opacity-5 pointer-events-none">
    <svg className="w-full h-full" fill="none">
      <defs>
        <pattern id="pattern-hex" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" className="text-violet-500 fill-current" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern-hex)" />
    </svg>
  </div>
);

// ---- Floating Particles Background ----
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-10 animate-float"
        style={{
          width: Math.random() * 60 + 20,
          height: Math.random() * 60 + 20,
          background: `radial-gradient(circle, ${
            ['#8b5cf6', '#a855f7', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)]
          } 0%, transparent 70%)`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 20}s`,
          animationDuration: `${Math.random() * 30 + 20}s`
        }}
      />
    ))}
  </div>
);

// ---- Animated Components ----
const AnimatedSection = ({ children, delay = 0, className = "" }) => {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 ease-out ${className} ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ---- API Helpers ----
const fetchSprints = async () => {
  const res = await fetch(`${API_BASE}/sprints`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch sprints");
  return data;
};

const fetchProgress = async () => {
  const res = await fetch(`${API_BASE}/progress`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch progress");
  return data;
};

const fetchUserStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/users/${getUserId()}/stats`, { 
      headers: getAuthHeaders() 
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `Status ${res.status}` }));
      console.error(`Failed to fetch user stats. Status: ${res.status}`, data.error);
      
      return { 
        totalSprints: 0, 
        completedSprints: 0, 
        totalMinutes: 0, 
        streakDays: 0,
        weeklyProgress: 0,
        learningHours: 0
      };
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Network error fetching user stats:", error);
    return { 
      totalSprints: 0, 
      completedSprints: 0, 
      totalMinutes: 0, 
      streakDays: 0,
      weeklyProgress: 0,
      learningHours: 0
    };
  }
};

const fetchRecentActivity = async () => {
  return [
    { id: 1, type: 'sprint_completed', title: 'Advanced React Hooks', time: '2 hours ago', icon: 'fa-check-circle', color: 'text-green-500' },
    { id: 2, type: 'sprint_started', title: 'TypeScript Mastery', time: '1 day ago', icon: 'fa-play-circle', color: 'text-blue-500' },
    { id: 3, type: 'note_created', title: 'Learning insights added', time: '2 days ago', icon: 'fa-sticky-note', color: 'text-yellow-500' },
    { id: 4, type: 'achievement', title: '7-Day Streak Unlocked!', time: '3 days ago', icon: 'fa-trophy', color: 'text-purple-500' }
  ];
};

const saveNote = async (type, id, text) => {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ contentType: type, contentId: id, noteText: text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save note");
  return data;
};

// ---- Enhanced Navbar Component ----
const Navbar = ({ userName, userStats, isMenuOpen, setIsMenuOpen, navigate }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "fa-home" },
    { name: "Lessons", path: "/lessons", icon: "fa-book" },
    { name: "Notes", path: "/notes", icon: "fa-sticky-note" },
  ];

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md border-b-2 border-black shadow-2xl' 
        : 'bg-white/90 backdrop-blur-sm border-b-2 border-black'
    }`}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer flex items-center"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl flex items-center justify-center mr-3 border-2 border-white shadow-lg">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-violet-700 tracking-tight">
              Skill<span className="text-indigo-900">Sprint</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex items-center px-4 py-2 text-gray-800 font-semibold rounded-xl hover:bg-violet-50 hover:text-violet-700 transition-all duration-200 border-2 border-transparent hover:border-violet-300"
              >
                <i className={`fas ${link.icon} mr-2 text-violet-600`}></i>
                {link.name}
              </button>
            ))}
          </div>

          {/* User Menu & Mobile Burger */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-700 hover:text-violet-700 transition-colors border-2 border-transparent hover:border-violet-300 rounded-xl">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-violet-50 px-4 py-2 rounded-2xl border-2 border-black">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600 flex items-center">
                  <i className="fas fa-fire text-red-500 mr-1"></i>
                  {userStats.streakDays} day streak
                </p>
              </div>
            </div>

                  {/* Logout Button */}
            {/* Login/Logout Button */}
<button
  onClick={() => {
    const confirmed = window.confirm("Are you sure you really want to log out?");
    if (confirmed) handleLogout();
  }}
  className="hidden sm:flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-700"
>
  <i className="fas fa-sign-out-alt mr-2"></i>
  Logout
</button>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 rounded-xl hover:bg-violet-100 border-2 border-transparent hover:border-violet-300 transition-colors"
            >
              <i
                className={`fas ${
                  isMenuOpen ? "fa-times" : "fa-bars"
                } text-xl transition-transform duration-300`}
              ></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`lg:hidden absolute left-0 right-0 top-full bg-white shadow-2xl border-t-2 border-black transform transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="px-4 py-4 flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  setIsMenuOpen(false);
                }}
                className="flex items-center text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-violet-50 transition text-lg border-2 border-transparent hover:border-violet-300"
              >
                <i className={`fas ${link.icon} mr-3 text-violet-600 w-6 text-center`}></i>
                {link.name}
              </button>
            ))}
            <div className="pt-4 border-t-2 border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-black"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ---- Stat Card Component ----
const StatCard = ({ icon, value, label, color, delay = 0, trend }) => {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <div
      ref={ref}
      className={`bg-white p-6 rounded-3xl shadow-xl ${cardBorder} transform transition-all duration-700 ${
        inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${hoverLift}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white text-2xl border-2 border-white shadow-lg`}>
          <i className={`fas ${icon}`}></i>
        </div>
        {trend && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            trend > 0 
              ? 'bg-green-100 text-green-700 border border-green-700' 
              : 'bg-red-100 text-red-700 border border-red-700'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
      <p className="text-gray-600 text-sm font-medium">{label}</p>
    </div>
  );
};

// ---- Progress Ring Component ----
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedProgress = Math.min(100, Math.max(0, progress || 0)); 
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(139, 92, 246)"
          strokeWidth={strokeWidth}
          fill="transparent"
          className=""
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-extrabold text-gray-900">{Math.round(normalizedProgress)}%</span>
        <div className="text-xs text-gray-600 font-medium">{label}</div>
      </div>
    </div>
  );
};

// ---- Enhanced Mini Notepad ----
const MiniNotepad = ({ initialText, onSave }) => {
  const [text, setText] = useState(initialText || "");
  const [saving, setSaving] = useState(false);

  const showToast = (message, type) => {
    const toast = document.createElement("div");
    toast.className = `fixed right-6 bottom-6 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-3 rounded-xl shadow-2xl animate-fadeInUp z-50 border-2 border-white`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'
        } mr-2"></i>
        <span class="font-semibold">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0'; 
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text);
      showToast("Note saved successfully!", "success");
    } catch (e) {
      console.error("Save note failed:", e);
      showToast("Failed to save note", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-3xl shadow-xl ${cardBorder} ${hoverLift}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-extrabold text-gray-900 flex items-center">
          <i className="fas fa-sticky-note text-yellow-500 mr-2"></i>
          Quick Notes
        </h4>
        <span className="text-xs text-gray-500 bg-violet-100 px-2 py-1 rounded-full border border-violet-300">
          <i className="fas fa-lock mr-1"></i> Private
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="📝 Jot down your learning insights, goals, or reminders..."
        className="w-full h-32 p-4 rounded-xl bg-violet-50 text-gray-800 border-2 border-black resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-4 w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-violet-700 ${
          saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
        }`}
      >
        {saving ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Saving...
          </>
        ) : (
          <>
            <i className="fas fa-save mr-2"></i>
            Save Note
          </>
        )}
      </button>
    </div>
  );
};

// ---- Enhanced Sprint Card ----
const SprintCard = ({ sprint, progress, onStart, index }) => {
  const [ref, inView] = useInView({ threshold: 0.15 });
  const progressKey = `dynamic-sprint-${sprint.id}`;
  const sprintProgress = parseFloat(progress[progressKey]?.progress || 0); 
  const isCompleted = progress[progressKey]?.completed || false; 
  const isActive = sprint.is_active;

  const getGradient = () => {
    if (isCompleted) return "from-green-600 to-green-800";
    if (isActive) return "from-violet-600 to-indigo-800";
    return "from-gray-600 to-gray-800";
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: "Completed", color: "bg-green-100 text-green-800 border border-green-800" };
    if (isActive) return { text: "Active", color: "bg-violet-600 text-white border border-violet-700" };
    return { text: "Ready", color: "bg-yellow-100 text-yellow-800 border border-yellow-800" };
  };

  const status = getStatusBadge();

  return (
    <div
      ref={ref}
      className={`bg-white rounded-3xl shadow-xl overflow-hidden ${cardBorder} cursor-pointer transform transition-all duration-700 ${
        inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${hoverLift}`}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={() => onStart(sprint)}
    >
      <div className="relative">
        <img
          src={sprint.thumbnail_url || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop"}
          alt={sprint.title}
          className="h-48 w-full object-cover border-b-2 border-black"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
            {status.text}
          </span>
        </div>
        {isActive && (
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 bg-yellow-400 text-gray-900 rounded-full text-xs font-bold animate-pulse border border-black">
              <i className="fas fa-bolt mr-1"></i> LIVE
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <span className="px-2 py-1 bg-black/80 text-white rounded-lg text-xs font-semibold border border-white/20">
            <i className="fas fa-clock mr-1"></i>
            {Math.ceil(sprint.max_duration_seconds / 60)}m
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-extrabold text-gray-900 leading-tight flex-1">
            <i className="fas fa-bolt text-yellow-500 mr-2"></i>
            {sprint.title}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
          {sprint.description}
        </p>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm font-bold text-violet-700">{Math.round(sprintProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 border border-black">
            <div
              style={{ width: `${Math.round(sprintProgress)}%` }}
              className={`h-3 bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-1000 ease-out border border-white/20`}
            ></div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart(sprint);
          }}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] border-2 ${
            isCompleted 
              ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 border-green-800'
              : isActive
              ? 'bg-gradient-to-r from-violet-600 to-indigo-800 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 border-violet-800'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-violet-900 shadow-lg hover:shadow-yellow-500/30 border-yellow-500'
          }`}
        >
          {isCompleted ? (
            <>
              <i className="fas fa-redo mr-2"></i>
              Review Sprint
            </>
          ) : isActive ? (
            <>
              <i className="fas fa-play mr-2"></i>
              Continue Sprint
            </>
          ) : (
            <>
              <i className="fas fa-flag mr-2"></i>
              Start Sprint
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ---- Activity Feed Component ----
const ActivityFeed = ({ activities }) => {
  return (
    <div className={`bg-white rounded-3xl shadow-xl ${cardBorder} ${hoverLift}`}>
      <div className="p-6 border-b-2 border-black">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
          <i className="fas fa-history text-violet-600 mr-3"></i>
          Recent Activity
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-300">
              <div className={`w-12 h-12 rounded-xl ${activity.color.replace('text', 'bg')} bg-opacity-10 flex items-center justify-center border-2 border-current border-opacity-20`}>
                <i className={`fas ${activity.icon} ${activity.color} text-lg`}></i>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Learning Path Component ----
const LearningPath = ({ progress }) => {
  const paths = [
    { title: "Frontend Foundation", progress: 80, courses: 12, color: "from-blue-600 to-blue-800" },
    { title: "Backend Mastery", progress: 45, courses: 8, color: "from-green-600 to-green-800" },
    { title: "DevOps & Tools", progress: 20, courses: 6, color: "from-orange-600 to-red-600" },
    { title: "Advanced Concepts", progress: 10, courses: 10, color: "from-purple-600 to-pink-600" },
  ];

  return (
    <div className={`bg-white rounded-3xl shadow-xl ${cardBorder} ${hoverLift}`}>
      <div className="p-6 border-b-2 border-black">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
          <i className="fas fa-road text-violet-600 mr-3"></i>
          Learning Paths
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {paths.map((path, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">{path.title}</span>
                <span className="text-sm text-violet-600 font-bold">{path.progress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 border border-black">
                <div
                  style={{ width: `${path.progress}%` }}
                  className={`h-3 bg-gradient-to-r ${path.color} rounded-full transition-all duration-1000 ease-out border border-white/20`}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{Math.ceil((path.courses * path.progress) / 100)}/{path.courses} courses</span>
                <span>{path.progress === 100 ? 'Completed!' : 'In Progress'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Weekly Goals Component ----
const WeeklyGoals = ({ userStats }) => {
  const goals = [
    {
      title: "Complete 3 Sprints",
      description: "2/3 completed",
      progress: 67,
      icon: "fa-check",
      color: "bg-green-600",
      completed: 2,
      total: 3
    },
    {
      title: "Maintain 7-day Streak",
      description: `Current: ${userStats.streakDays}/7 days`,
      progress: Math.min(100, (userStats.streakDays / 7) * 100),
      icon: "fa-fire",
      color: "bg-blue-600",
      completed: userStats.streakDays,
      total: 7
    },
    {
      title: "Learn 5 Hours",
      description: `${userStats.learningHours}/5 hours`,
      progress: Math.min(100, (userStats.learningHours / 5) * 100),
      icon: "fa-clock",
      color: "bg-orange-600",
      completed: userStats.learningHours,
      total: 5
    }
  ];

  return (
    <div className={`bg-white rounded-3xl shadow-xl p-6 ${cardBorder} ${hoverLift}`}>
      <div className="p-6 border-b-2 border-black">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center">
          <i className="fas fa-trophy text-yellow-500 mr-3"></i>
          Weekly Goals
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border-2 border-black">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{goal.title}</p>
                <p className="text-sm text-gray-600">{goal.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 border border-black">
                  <div
                    style={{ width: `${goal.progress}%` }}
                    className={`h-2 bg-gradient-to-r from-violet-600 to-indigo-700 rounded-full transition-all duration-1000 ease-out border border-white/20`}
                  ></div>
                </div>
              </div>
              <div className={`w-12 h-12 ${goal.color} rounded-xl flex items-center justify-center text-white border border-black ml-4`}>
                <i className={`fas ${goal.icon} text-lg`}></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Main Dashboard Component ----
const Dashboard = () => {
  const navigate = useNavigate();
  const [userName] = useState(sessionStorage.getItem("userName") || "Pro Learner");
  const [progress, setProgress] = useState({});
  const [sprints, setSprints] = useState([]);
  const [userStats, setUserStats] = useState({
    totalSprints: 0,
    completedSprints: 0,
    totalMinutes: 0,
    streakDays: 0,
    weeklyProgress: 0,
    learningHours: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (message, type) => {
    const toast = document.createElement("div");
    toast.className = `fixed right-6 bottom-6 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-3 rounded-xl shadow-2xl z-50 border-2 border-white`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'
        } mr-2"></i>
        <span class="font-semibold">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500);
    }, 4000);
  };
  
  // Fixed loadDashboard function with proper progress calculation
  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      const [progressData, sprintData, statsData, activityData] = await Promise.all([
        fetchProgress(),
        fetchSprints(),
        fetchUserStats(),
        fetchRecentActivity()
      ]);
      
      setProgress(progressData);
      setSprints(sprintData);
      setRecentActivity(activityData);
      setActiveSprint(sprintData.find((s) => s.is_active) || null);
      
      // Calculate user stats based on actual data
      const completedSprintsCount = Object.values(progressData).filter(p => p.completed).length;
      const totalMinutes = Object.values(progressData).reduce((total, p) => total + (p.progress || 0), 0);
      
      setUserStats({
        totalSprints: sprintData.length,
        completedSprints: completedSprintsCount,
        totalMinutes: Math.round(totalMinutes),
        streakDays: statsData.streakDays || 0,
        weeklyProgress: statsData.weeklyProgress || 0,
        learningHours: statsData.learningHours || 0
      });
      
    } catch (e) {
      console.error("Dashboard load error:", e);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setIsLoaded(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // FIXED: Updated handleStart to navigate to individual sprint page with correct parameter
  const handleStart = (sprint) => navigate(`/sprints/${sprint.id}`);
  const handleRefresh = () => loadDashboard();

  // Fixed progress calculation
  const completedSprints = Object.values(progress).filter(p => p.completed).length;
  const completionRate = sprints.length > 0 ? Math.round((completedSprints / sprints.length) * 100) : 0;

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 text-gray-800 relative overflow-hidden">
        <BackgroundPattern />
        <FloatingParticles />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-2xl">
            <i className="fas fa-bolt text-white text-2xl animate-pulse"></i>
          </div>
          <p className="text-xl font-semibold mb-2">Loading Your Learning Dashboard</p>
          <p className="text-gray-600">Preparing your personalized learning experience...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 font-['Poppins'] text-gray-800 antialiased relative overflow-hidden">
      <BackgroundPattern />
      <FloatingParticles />
      
      {/* Load Font Awesome and Poppins Font */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Enhanced Navbar */}
      <Navbar 
        userName={userName}
        userStats={userStats}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        navigate={navigate}
      />

      {/* Main Content */}
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto pb-16 relative z-10">
        
        {/* Welcome Section */}
        <AnimatedSection className="mb-8">
          <div className="bg-gradient-to-br from-violet-800 to-indigo-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden border-2 border-black">
            {/* Background Elements */}
             <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" fill="none">
                    <defs>
                        <pattern id="pattern-hex" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" className="text-white fill-current" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pattern-hex)" />
                </svg>
            </div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-400 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
                    Welcome back, <span className="text-yellow-300">{userName}</span>! 👋
                  </h1>
                  <p className="text-violet-200 text-lg sm:text-xl max-w-2xl">
                    {activeSprint 
                      ? `Your active sprint "${activeSprint.title}" is waiting for you!` 
                      : "Ready to start your next learning sprint? Choose from the available sprints below."}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`mt-4 lg:mt-0 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border-2 border-white/30 ${
                    refreshing ? 'animate-spin' : 'hover:scale-105'
                  }`}
                >
                  <i className="fas fa-redo mr-2"></i>
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon="fa-rocket"
                  value={userStats.totalSprints}
                  label="Total Sprints"
                  color="bg-gradient-to-br from-violet-600 to-indigo-700"
                  delay={100}
                  trend={12}
                />
                <StatCard
                  icon="fa-check-circle"
                  value={completedSprints}
                  label="Completed"
                  color="bg-gradient-to-br from-green-600 to-green-700"
                  delay={200}
                  trend={8}
                />
                <StatCard
                  icon="fa-clock"
                  value={userStats.totalMinutes}
                  label="Minutes Learned"
                  color="bg-gradient-to-br from-yellow-500 to-orange-500"
                  delay={300}
                  trend={15}
                />
                <StatCard
                  icon="fa-fire"
                  value={userStats.streakDays}
                  label="Day Streak"
                  color="bg-gradient-to-br from-pink-600 to-rose-600"
                  delay={400}
                  trend={5}
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Sprint Card */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border-2 border-white/20">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                    <i className="fas fa-bolt text-yellow-400 mr-2"></i>
                    Active Sprint
                  </h3>
                  {activeSprint ? (
                    <div>
                      <p className="text-white font-semibold text-xl mb-2">{activeSprint.title}</p>
                      <p className="text-violet-200 text-sm mb-4 line-clamp-2">{activeSprint.description}</p>
                      <button
                        onClick={() => handleStart(activeSprint)}
                        className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-violet-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-yellow-500"
                      >
                        <i className="fas fa-play mr-2"></i>
                        Continue Learning
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-flag text-3xl text-violet-300 mb-3"></i>
                      <p className="text-violet-200 mb-3">No active sprint</p>
                      <button
                        onClick={() => document.getElementById('sprints-grid')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
                      >
                        Start a Sprint
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Notes */}
                <MiniNotepad
                  initialText=""
                  onSave={(text) => saveNote("dashboard", 0, text)}
                />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Progress Overview & Activity Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Progress Overview */}
          <AnimatedSection delay={200} className="xl:col-span-2">
            <div className={`bg-white rounded-3xl shadow-xl p-6 ${cardBorder}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 flex items-center mb-4 sm:mb-0">
                  <i className="fas fa-chart-line text-violet-600 mr-3"></i>
                  Learning Progress Overview
                </h2 >
                <div className="text-center sm:text-right">
                  <ProgressRing progress={completionRate} label="Overall" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-2xl border-2 border-black">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{completedSprints}</div>
                  <div className="text-sm text-gray-600">Sprints Completed</div>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-2xl border-2 border-black">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{sprints.length - completedSprints}</div>
                  <div className="text-sm text-gray-600">Sprints Remaining</div>
                </div>
                <div className="text-center p-4 bg-violet-50 rounded-2xl border-2 border-black">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.streakDays}</div>
                  <div className="text-sm text-gray-600">Learning Streak</div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Recent Activity */}
          <AnimatedSection delay={300}>
            <ActivityFeed activities={recentActivity} />
          </AnimatedSection>
        </div>

        {/* Learning Paths & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AnimatedSection delay={400}>
            <LearningPath progress={progress} />
          </AnimatedSection>

          <AnimatedSection delay={500}>
            <WeeklyGoals userStats={userStats} />
          </AnimatedSection>
        </div>

        {/* Sprint Grid */}
        <AnimatedSection delay={600} id="sprints-grid">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                  <i className="fas fa-rocket text-violet-600 mr-3"></i>
                  Available Learning Sprints
                </h2>
                <p className="text-gray-600 text-lg">
                  Choose your next 60-minute deep dive into high-value skills
                </p>
              </div>
            </div>

            {sprints.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl shadow-xl border-2 border-black">
                <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Sprints Available</h3>
                <p className="text-gray-500 mb-4">Check back later for new learning opportunities</p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors border-2 border-black"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Refresh
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sprints.map((sprint, index) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    progress={progress}
                    onStart={handleStart}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t-2 border-black relative z-10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-3xl font-extrabold text-yellow-400 mb-4 flex items-center">
                <i className="fas fa-bolt mr-2"></i>
                SkillSprint
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Master high-value skills in focused 60-minute sprints. Built for modern professionals who value efficiency.
              </p>
              <div className="flex space-x-4 text-2xl">
                <a href="https://twitter.com" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://linkedin.com" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4 text-lg border-b-2 border-gray-800 pb-2">Platform</h4>
              <div className="space-y-2">
                {['Dashboard', 'Lessons', 'Notes'].map(item => (
                  <button 
                    key={item} 
                    onClick={() => navigate(`/${item.toLowerCase()}`)}
                    className="block text-gray-400 hover:text-white transition-colors text-left w-full"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4 text-lg border-b-2 border-gray-800 pb-2">Support</h4>
              <div className="space-y-2">
                {['Help Center', 'Community', 'Contact', 'Feedback'].map(item => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4 text-lg border-b-2 border-gray-800 pb-2">Company</h4>
              <div className="space-y-2">
                {['About', 'Careers', 'Blog', 'Press'].map(item => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t-2 border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} SkillSprint Global. All rights reserved. | 
              Built with <i className="fas fa-heart text-red-500 mx-1"></i> for learners worldwide
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s linear infinite;
        }
      `}</style>

    </div>
  );
};



export default Dashboard;