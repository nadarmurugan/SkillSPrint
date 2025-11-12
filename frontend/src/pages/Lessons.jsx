// Lessons.jsx - UPDATED WITH REFLECTION MARKING SYSTEM
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// --- API Configs & Utilities ---
const API_BASE_URL = 'http://localhost:5050/api';
const LESSON_API_URL = `${API_BASE_URL}/lessons`;
const NOTES_API_URL = `${API_BASE_URL}/notes`;

const getUserId = () => parseInt(sessionStorage.getItem('userId') || '1', 10);
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
});

// --- Animation Hook (from Dashboard) ---
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

// --- Enhanced UI Classes ---
const hoverLift = "transition duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-violet-300 border-2 border-transparent";
const cardBorder = "border-2 border-black shadow-lg";
const sectionBorder = "border-b-2 border-black";

// --- Background Components (from Dashboard) ---
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

// --- Animated Section Component ---
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

// --- API Functions for Reflection System ---
const fetchReflectionApi = async (lessonId) => {
    const res = await fetch(`${LESSON_API_URL}/${lessonId}/reflection`, { 
        headers: getAuthHeaders() 
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load reflection");
    return data;
};

const saveReflectionDraftApi = async (lessonId, reflectionText) => {
    const res = await fetch(`${LESSON_API_URL}/${lessonId}/reflection`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reflection_text: reflectionText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save reflection draft");
    return data;
};

const submitReflectionApi = async (lessonId, reflectionText) => {
    const res = await fetch(`${LESSON_API_URL}/${lessonId}/reflection/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reflection_text: reflectionText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit reflection");
    return data;
};

const resubmitReflectionApi = async (lessonId, reflectionText) => {
    const res = await fetch(`${LESSON_API_URL}/${lessonId}/reflection/resubmit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reflection_text: reflectionText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to resubmit reflection");
    return data;
};

// --- Enhanced Components ---
const LevelBadge = ({ level }) => {
    const getConfig = () => {
        switch (level?.toLowerCase()) {
            case "beginner":
                return { color: "from-green-500 to-green-600", text: "🟢 Beginner", bg: "bg-green-100" };
            case "intermediate":
                return { color: "from-yellow-500 to-yellow-600", text: "🟡 Intermediate", bg: "bg-yellow-100" };
            case "advanced":
                return { color: "from-red-500 to-red-600", text: "🔴 Advanced", bg: "bg-red-100" };
            default:
                return { color: "from-gray-500 to-gray-600", text: "Unknown", bg: "bg-gray-100" };
        }
    };

    const config = getConfig();
    
    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border border-black ${config.bg} text-gray-900`}>
            {config.text}
        </span>
    );
};

// --- NEW: Marking Badge Component ---
const MarkingBadge = ({ score, feedback, status }) => {
    const getScoreColor = (score) => {
        if (score >= 9) return "from-green-500 to-green-600";
        if (score >= 7) return "from-yellow-500 to-yellow-600";
        if (score >= 5) return "from-orange-500 to-orange-600";
        return "from-red-500 to-red-600";
    };

    return (
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-2 border-blue-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <i className="fas fa-star text-yellow-500 mr-2"></i>
                    Reflection Marked
                </h4>
                <div className={`px-4 py-2 rounded-full text-white font-bold text-lg bg-gradient-to-r ${getScoreColor(score)} border-2 border-white shadow-lg`}>
                    {score}/10
                </div>
            </div>
            
            {feedback && (
                <div className="mt-4">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <i className="fas fa-comment-dots text-blue-600 mr-2"></i>
                        Feedback from Admin:
                    </h5>
                    <p className="text-gray-700 bg-white p-4 rounded-xl border-2 border-blue-200 leading-relaxed">
                        {feedback}
                    </p>
                </div>
            )}
            
            {status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                    <p className="text-red-700 font-semibold flex items-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Your reflection needs improvement. Please revise and resubmit.
                    </p>
                </div>
            )}
        </div>
    );
};

const LessonCard = ({ lesson, isSelected, onClick, index }) => {
    const [ref, inView] = useInView({ threshold: 0.15 });

    return (
        <div
            ref={ref}
            className={`bg-white rounded-3xl shadow-xl overflow-hidden ${cardBorder} cursor-pointer transform transition-all duration-700 ${
                inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } ${hoverLift} ${isSelected ? 'ring-4 ring-violet-500' : ''}`}
            style={{ transitionDelay: `${index * 100}ms` }}
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900 leading-tight mb-2">
                            <i className="fas fa-book text-violet-600 mr-2"></i>
                            {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {lesson.description}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <LevelBadge level={lesson.level} />
                    <span className="text-xs text-gray-500 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">
                        <i className="fas fa-clock mr-1"></i>
                        15min
                    </span>
                </div>
                
                {lesson.skill_category && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">
                            {lesson.skill_category}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Navigation Components ---
const Navbar = ({ userName, currentPath, navigate }) => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: "Dashboard", path: "/dashboard", icon: "fa-home" },
        { name: "Text Sprints", path: "/lessons", icon: "fa-book" },
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
                        {navLinks.map((link) => {
                            const isActive = currentPath === link.path;
                            return (
                                <button
                                    key={link.name}
                                    onClick={() => navigate(link.path)}
                                    className={`flex items-center px-4 py-2 font-semibold rounded-xl transition-all duration-200 border-2 ${
                                        isActive
                                            ? 'bg-violet-600 text-white border-violet-700 shadow-lg'
                                            : 'text-gray-800 border-transparent hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300'
                                    }`}
                                >
                                    <i className={`fas ${link.icon} mr-2 ${isActive ? 'text-white' : 'text-violet-600'}`}></i>
                                    {link.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Menu & Mobile Burger */}
                    <div className="flex items-center space-x-3">
                        {/* User Profile */}
                        <div className="flex items-center space-x-3 bg-violet-50 px-4 py-2 rounded-2xl border-2 border-black">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                                <p className="text-xs text-gray-600 flex items-center">
                                    <i className="fas fa-book text-violet-600 mr-1"></i>
                                    Learning
                                </p>
                            </div>
                        </div>

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

const Footer = ({ navigate }) => {
    const navLinks = [
        { name: "How It Works", path: "/#process" },
        { name: "Features", path: "/#features" },
        { name: "Sprints", path: "/#courses" },
        { name: "About", path: "/#about" },
        { name: "FAQ", path: "/#faq" },
    ];

    return (
        <footer className="bg-gray-900 text-white py-12 border-t-2 border-black relative z-10">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="text-3xl font-extrabold text-yellow-400 mb-4 flex items-center">
                            <i className="fas fa-bolt mr-2"></i>
                            SkillSprint
                        </div>
                        <p className="text-gray-400 mb-4 leading-relaxed">
                            Master high-value skills in focused learning sessions. Built for modern professionals who value efficiency.
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
                            {['Dashboard', 'Lessons', 'Sprints', 'Notes'].map(item => (
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
    );
};

// --- Main Lessons Page Component ---
const LessonsPage = () => {
    const navigate = useNavigate();
    const userName = sessionStorage.getItem("userName") || "Pro Learner";
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [reflection, setReflection] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // NEW STATE FOR REFLECTION SYSTEM
    const [reflectionData, setReflectionData] = useState({
        status: 'draft', // 'draft', 'submitted', 'marked', 'rejected'
        score: null,
        admin_feedback: null,
        submitted_at: null,
        marked_at: null
    });

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

    // Update the loadReflection function
    const loadReflection = useCallback(async (lessonId) => {
        if (!lessonId) {
            setReflection("");
            setReflectionData({ status: 'draft', score: null, admin_feedback: null });
            return;
        }
        try {
            const data = await fetchReflectionApi(lessonId);
            setReflection(data.reflection_text || "");
            setReflectionData({
                status: data.status || 'draft',
                score: data.score,
                admin_feedback: data.admin_feedback,
                submitted_at: data.submitted_at,
                marked_at: data.marked_at
            });
        } catch (err) {
            console.error("Error loading reflection:", err);
            setReflection("");
            setReflectionData({ status: 'draft', score: null, admin_feedback: null });
        }
    }, []);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await fetch(LESSON_API_URL, { headers: getAuthHeaders() });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to load lessons");
                if (!Array.isArray(data)) throw new Error("Invalid data format from API");
                
                setLessons(data);
                if (data.length > 0) {
                    setSelectedLesson(data[0]);
                    await loadReflection(data[0].id);
                }
            } catch (err) {
                console.error("Error fetching text lessons:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLessons();
    }, [loadReflection]);

    const handleLessonSelect = (lesson) => {
        setSelectedLesson(lesson);
        loadReflection(lesson.id);
    };

    // NEW: Handle draft saving
    const handleSaveDraft = async () => {
        if (!selectedLesson) return;
        if (!reflection.trim()) {
            showToast("Please write your reflection first!", "error");
            return;
        }

        setSaving(true);
        try {
            await saveReflectionDraftApi(selectedLesson.id, reflection);
            showToast("Draft saved successfully!", "success");
        } catch (err) {
            console.error("Error saving draft:", err);
            showToast(`Failed to save draft: ${err.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    // NEW: Handle submission for marking
    const handleSubmitForMarking = async () => {
        if (!selectedLesson) return;
        if (!reflection.trim()) {
            showToast("Please write your reflection first!", "error");
            return;
        }

        setSubmitting(true);
        try {
            await submitReflectionApi(selectedLesson.id, reflection);
            setReflectionData(prev => ({ ...prev, status: 'submitted' }));
            showToast("Reflection submitted for marking! An admin will review it soon.", "success");
        } catch (err) {
            console.error("Error submitting reflection:", err);
            showToast(`Failed to submit reflection: ${err.message}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Handle resubmission
    const handleResubmit = async () => {
        if (!selectedLesson) return;
        if (!reflection.trim()) {
            showToast("Please write your reflection first!", "error");
            return;
        }

        setSubmitting(true);
        try {
            await resubmitReflectionApi(selectedLesson.id, reflection);
            setReflectionData(prev => ({ ...prev, status: 'submitted' }));
            showToast("Reflection resubmitted for marking!", "success");
        } catch (err) {
            console.error("Error resubmitting reflection:", err);
            showToast(`Failed to resubmit reflection: ${err.message}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Handle revision (back to draft)
    const handleRevise = () => {
        setReflectionData(prev => ({ ...prev, status: 'draft' }));
        showToast("You can now revise your reflection", "success");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 text-gray-800 relative overflow-hidden">
                <BackgroundPattern />
                <FloatingParticles />
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-2xl">
                        <i className="fas fa-book text-white text-2xl animate-pulse"></i>
                    </div>
                    <p className="text-xl font-semibold mb-2">Loading Text Sprints</p>
                    <p className="text-gray-600">Preparing your learning materials...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 font-['Poppins'] text-gray-800 antialiased relative overflow-hidden">
            <BackgroundPattern />
            <FloatingParticles />
            
            {/* Load Font Awesome and Poppins Font */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Enhanced Navbar */}
            <Navbar 
                userName={userName}
                currentPath={window.location.pathname}
                navigate={navigate}
            />

            {/* Main Content */}
            <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto pb-16 relative z-10">
                {/* Header Section */}
                <AnimatedSection className="mb-8">
                    <div className="bg-gradient-to-br from-violet-800 to-indigo-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden border-2 border-black">
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
                        <div className="relative z-10">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 flex items-center">
                                <i className="fas fa-book-open mr-4 text-yellow-300"></i>
                                Text Sprints
                            </h1>
                            <p className="text-violet-200 text-lg sm:text-xl max-w-2xl">
                                Learn by reading, coding, and reflecting. No videos, just pure skill development through focused text-based learning.
                            </p>
                            <div className="flex items-center mt-6 space-x-4">
                                <div className="bg-white/20 px-4 py-2 rounded-xl border border-white/30">
                                    <span className="text-white font-semibold">{lessons.length} Lessons</span>
                                </div>
                                <div className="bg-white/20 px-4 py-2 rounded-xl border border-white/30">
                                    <span className="text-white font-semibold">All Levels</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {error ? (
                    <AnimatedSection>
                        <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-8 text-center">
                            <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                            <h3 className="text-xl font-bold text-red-800 mb-2">Loading Error</h3>
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors border-2 border-red-700"
                            >
                                <i className="fas fa-redo mr-2"></i>
                                Try Again
                            </button>
                        </div>
                    </AnimatedSection>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Lessons Sidebar */}
                        <AnimatedSection delay={200} className="xl:col-span-1">
                            <div className={`bg-white rounded-3xl shadow-xl p-6 ${cardBorder} ${hoverLift}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                                        <i className="fas fa-list-ul text-violet-600 mr-3"></i>
                                        Lessons ({lessons.length})
                                    </h2>
                                </div>
                                
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {lessons.map((lesson, index) => (
                                        <LessonCard
                                            key={lesson.id}
                                            lesson={lesson}
                                            isSelected={selectedLesson?.id === lesson.id}
                                            onClick={() => handleLessonSelect(lesson)}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Lesson Content */}
                        <AnimatedSection delay={300} className="xl:col-span-3">
                            {selectedLesson ? (
                                <div className={`bg-white rounded-3xl shadow-xl overflow-hidden ${cardBorder}`}>
                                    {/* Lesson Header */}
                                    <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-6 text-white border-b-2 border-black">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
                                                    {selectedLesson.title}
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <LevelBadge level={selectedLesson.level} />
                                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm border border-white/30">
                                                        <i className="fas fa-tag mr-1"></i>
                                                        {selectedLesson.skill_category || "General"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0">
                                                <span className="bg-yellow-400 text-violet-900 px-3 py-2 rounded-xl font-bold text-sm border-2 border-yellow-500">
                                                    <i className="fas fa-clock mr-1"></i>
                                                    15min read
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lesson Content */}
                                    <div className="p-6">
                                        {/* Description */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                <i className="fas fa-info-circle text-violet-600 mr-2"></i>
                                                Overview
                                            </h3>
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                {selectedLesson.description}
                                            </p>
                                        </div>

                                        {/* Code Snippet */}
                                        {selectedLesson.code_snippet && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                    <i className="fas fa-code text-violet-600 mr-2"></i>
                                                    Code Example
                                                </h3>
                                                <div className="bg-gray-900 rounded-2xl overflow-hidden border-2 border-black">
                                                    <div className="bg-gray-800 px-4 py-2 border-b-2 border-black flex items-center justify-between">
                                                        <span className="text-white font-semibold text-sm">
                                                            <i className="fas fa-terminal mr-2"></i>
                                                            example.js
                                                        </span>
                                                        <button className="text-gray-400 hover:text-white transition-colors">
                                                            <i className="fas fa-copy"></i>
                                                        </button>
                                                    </div>
                                                    <pre className="p-4 text-green-400 overflow-x-auto text-sm sm:text-base">
                                                        {selectedLesson.code_snippet}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Challenge */}
                                        {selectedLesson.challenge && (
                                            <div className="mb-8">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                    <i className="fas fa-puzzle-piece text-yellow-500 mr-2"></i>
                                                    Your Challenge
                                                </h3>
                                                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
                                                    <p className="text-gray-800 leading-relaxed">
                                                        {selectedLesson.challenge}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reflection Section */}
                                        <div className="mt-8 pt-6 border-t-2 border-gray-200">
                                            <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center">
                                                <i className="fas fa-edit text-violet-600 mr-2"></i>
                                                Your Reflection
                                                {reflectionData.status !== 'draft' && (
                                                    <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold border ${
                                                        reflectionData.status === 'submitted' 
                                                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                                            : reflectionData.status === 'marked'
                                                            ? 'bg-green-100 text-green-800 border-green-300'
                                                            : 'bg-red-100 text-red-800 border-red-300'
                                                    }`}>
                                                        {reflectionData.status.toUpperCase()}
                                                    </span>
                                                )}
                                            </h3>

                                            {/* Show marking results if marked */}
                                            {reflectionData.status === 'marked' && reflectionData.score !== null && (
                                                <MarkingBadge 
                                                    score={reflectionData.score} 
                                                    feedback={reflectionData.admin_feedback}
                                                    status={reflectionData.status}
                                                />
                                            )}

                                            {/* Show rejection message if rejected */}
                                            {reflectionData.status === 'rejected' && (
                                                <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-2xl">
                                                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                                                        <i className="fas fa-exclamation-circle mr-2"></i>
                                                        Needs Improvement
                                                    </h4>
                                                    <p className="text-red-700">{reflectionData.admin_feedback}</p>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <textarea
                                                    value={reflection}
                                                    onChange={(e) => setReflection(e.target.value)}
                                                    placeholder="📝 Write your thoughts, code experiments, or key takeaways from this lesson..."
                                                    className="w-full h-40 p-4 rounded-xl bg-violet-50 text-gray-800 border-2 border-black resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300"
                                                    disabled={reflectionData.status === 'submitted' || reflectionData.status === 'marked'}
                                                />
                                                
                                                {/* Status Messages */}
                                                {reflectionData.status === 'submitted' && (
                                                    <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl">
                                                        <p className="text-blue-700 font-semibold flex items-center">
                                                            <i className="fas fa-clock mr-2"></i>
                                                            Your reflection is currently under review by an admin.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    {/* Draft State */}
                                                    {reflectionData.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={handleSaveDraft}
                                                                disabled={saving}
                                                                className={`flex-1 py-4 bg-gray-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-700 ${
                                                                    saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                                                                }`}
                                                            >
                                                                {saving ? (
                                                                    <>
                                                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                                                        Saving Draft...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="fas fa-save mr-2"></i>
                                                                        Save Draft
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleSubmitForMarking}
                                                                disabled={submitting}
                                                                className={`flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-violet-700 ${
                                                                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                                                                }`}
                                                            >
                                                                {submitting ? (
                                                                    <>
                                                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                                                        Submitting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="fas fa-paper-plane mr-2"></i>
                                                                        Submit for Marking
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Marked State - Option to resubmit */}
                                                    {reflectionData.status === 'marked' && (
                                                        <button
                                                            onClick={handleResubmit}
                                                            disabled={submitting}
                                                            className={`w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-600 ${
                                                                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                                                            }`}
                                                        >
                                                            {submitting ? (
                                                                <>
                                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                                    Resubmitting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fas fa-redo mr-2"></i>
                                                                    Revise and Resubmit
                                                                </>
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Rejected State - Must resubmit */}
                                                    {reflectionData.status === 'rejected' && (
                                                        <button
                                                            onClick={handleRevise}
                                                            className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-600 hover:scale-[1.02]"
                                                        >
                                                            <i className="fas fa-edit mr-2"></i>
                                                            Revise Reflection
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Help Text */}
                                                <p className="text-sm text-gray-600 text-center">
                                                    {reflectionData.status === 'draft' 
                                                        ? "Save as draft to continue later, or submit for marking to get feedback from an admin."
                                                        : reflectionData.status === 'submitted'
                                                        ? "Your reflection has been submitted and is awaiting review."
                                                        : "Your reflection has been reviewed. You can revise and resubmit if needed."
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`bg-white rounded-3xl shadow-xl p-12 text-center ${cardBorder}`}>
                                    <i className="fas fa-book-open text-gray-300 text-6xl mb-6"></i>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-4">No Lesson Selected</h3>
                                    <p className="text-gray-500 mb-6">Choose a lesson from the sidebar to start learning</p>
                                    <div className="w-16 h-1 bg-violet-600 rounded-full mx-auto"></div>
                                </div>
                            )}
                        </AnimatedSection>
                    </div>
                )}
            </main>

            {/* Enhanced Footer */}
            <Footer navigate={navigate} />

            {/* Custom CSS for floating animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                .animate-float {
                    animation: float 6s linear infinite;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 40px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LessonsPage;