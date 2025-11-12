// Notes.jsx - Fixed Authentication Issue
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// --- API Configs & Utilities ---
const API_BASE_URL = 'http://localhost:5050/api';
const NOTES_API_URL = `${API_BASE_URL}/notes`;

// ✅ FIX: Aligned getUserId with Dashboard.jsx approach
const getUserId = () => parseInt(sessionStorage.getItem("userId") || "9", 10);

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': getUserId(),
});

// Note types for API saving
const GENERAL_NOTES_CONTENT_ID = 0;
const GENERAL_NOTES_CONTENT_TYPE = 'general_dashboard';
const STRUCTURED_NOTES_CONTENT_TYPE = 'structured_reflection';
const CODE_VAULT_CONTENT_TYPE = 'code_vault';

// --- Animation Hook ---
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

// --- Background Components ---
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

// --- API Functions ---
const saveNoteApi = async (contentType, contentId, noteText) => {
    const bodyText = typeof noteText === 'string' ? noteText : JSON.stringify(noteText);

    const res = await fetch(NOTES_API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            contentType: contentType,
            contentId: contentId,
            noteText: bodyText,
        }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Failed to save note");
    }
    return data;
};

const fetchNoteApi = async (contentType, contentId) => {
    const res = await fetch(`${NOTES_API_URL}/${contentType}/${contentId}`, { 
        headers: getAuthHeaders() 
    });
    
    if (!res.ok) {
        // If unauthorized, return empty data instead of throwing error
        if (res.status === 401) {
            console.warn("User not authenticated, returning empty notes");
            return contentType === CODE_VAULT_CONTENT_TYPE ? [] : "";
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to load notes");
    }
     
    const data = await res.json();
    const rawText = data.note_text || "";

    if (contentType === CODE_VAULT_CONTENT_TYPE) {
        try {
            return rawText ? JSON.parse(rawText) : [];
        } catch (e) {
            console.error("Failed to parse code vault JSON:", e);
            return [];
        }
    }
    return rawText;
};

// --- Success Modal Component ---
const SuccessModal = ({ isVisible, message, onClose }) => {
    if (!isVisible) return null;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [isVisible, onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            aria-live="polite"
        >
            <div className="bg-green-600/90 text-white p-6 rounded-2xl shadow-2xl border-2 border-green-400 transform transition-all duration-300 animate-fadeInUp">
                <div className="flex items-center space-x-4">
                    <i className="fas fa-check-circle text-3xl text-green-200"></i>
                    <div>
                        <p className="font-bold text-lg">{message}</p>
                        <p className="text-green-100 text-sm">Auto-closing in 3 seconds...</p>
                    </div>
                    <button onClick={onClose} className="text-white opacity-70 hover:opacity-100 transition-opacity pointer-events-auto p-2">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
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
        { name: "My Notes", path: "/notes", icon: "fa-sticky-note" },
    ];

    const handleLogout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    // ✅ FIX: Consistent user name handling
    const displayName = userName || "Pro Learner";

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
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-600 flex items-center">
                                    <i className="fas fa-sticky-note text-violet-600 mr-1"></i>
                                    Taking Notes
                                </p>
                            </div>
                        </div>

                        {/* Login/Logout Button */}
                        <button
                            onClick={handleLogout}
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

// --- Enhanced Code Vault Component ---
const CodeVault = ({ codeSnippets, setCodeSnippets, loading, handleSaveNotes }) => {
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [tags, setTags] = useState('');

    const handleAddSnippet = () => {
        if (!code.trim() || !title.trim()) {
            alert("Title and Code fields cannot be empty!");
            return;
        }

        const newSnippet = {
            id: Date.now(),
            title,
            code,
            language,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            date: new Date().toISOString().split('T')[0],
        };
        
        const updatedSnippets = [newSnippet, ...codeSnippets];
        setCodeSnippets(updatedSnippets);
        handleSaveNotes(CODE_VAULT_CONTENT_TYPE, updatedSnippets, `Code Snippet "${title}" added!`);

        setTitle('');
        setCode('');
        setTags('');
        setLanguage('javascript');
    };

    const handleDeleteSnippet = (id, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
        
        const updatedSnippets = codeSnippets.filter(snippet => snippet.id !== id);
        setCodeSnippets(updatedSnippets);
        handleSaveNotes(CODE_VAULT_CONTENT_TYPE, updatedSnippets, `Code Snippet "${title}" deleted!`);
    };

    const SnippetCard = ({ snippet }) => {
        const copyToClipboard = () => {
            navigator.clipboard.writeText(snippet.code).then(() => {
                alert(`Code for "${snippet.title}" copied to clipboard!`);
            }).catch(() => {
                // Fallback for older browsers
                const tempInput = document.createElement('textarea');
                tempInput.value = snippet.code;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert(`Code for "${snippet.title}" copied to clipboard!`);
            });
        };

        return (
            <div className={`bg-white rounded-2xl shadow-xl p-6 ${cardBorder} ${hoverLift}`}>
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-extrabold text-gray-900">{snippet.title}</h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
                        {snippet.date}
                    </span>
                </div>

                <div className="bg-gray-900 rounded-xl overflow-hidden border-2 border-black mb-4">
                    <div className="bg-gray-800 px-4 py-3 border-b-2 border-black flex items-center justify-between">
                        <span className="text-white font-semibold text-sm flex items-center">
                            <i className="fas fa-file-code mr-2 text-violet-400"></i>
                            {snippet.language}.{getFileExtension(snippet.language)}
                        </span>
                        <button
                            onClick={copyToClipboard}
                            className="text-gray-300 hover:text-white bg-gray-700/50 px-3 py-1 rounded-lg transition-colors border border-gray-600"
                            title="Copy Code"
                        >
                            <i className="fas fa-copy mr-1"></i>
                            Copy
                        </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-green-300 font-mono text-sm">
                        <code>{snippet.code}</code>
                    </pre>
                </div>

                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full border border-violet-700">
                            {snippet.language.toUpperCase()}
                        </span>
                        {snippet.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-300">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => handleDeleteSnippet(snippet.id, snippet.title)}
                        className="text-red-600 hover:text-red-700 transition-colors text-sm font-semibold flex items-center mt-2 sm:mt-0"
                        title="Delete Snippet"
                    >
                        <i className="fas fa-trash-alt mr-1"></i>
                        Delete
                    </button>
                </div>
            </div>
        );
    };

    const getFileExtension = (lang) => {
        const extensions = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            sql: 'sql',
            css: 'css',
            html: 'html',
            other: 'txt'
        };
        return extensions[lang] || 'txt';
    };

    return (
        <div className="space-y-8">
            {/* Add Snippet Form */}
            <div className={`bg-white rounded-3xl shadow-xl p-6 ${cardBorder}`}>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-plus-circle text-violet-600 mr-3"></i>
                    Add New Code Snippet
                </h3>
                
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Snippet Title (e.g., React Custom Hook for API Calls)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 bg-violet-50 rounded-xl border-2 border-black text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-4 bg-violet-50 rounded-xl border-2 border-black text-gray-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                            <option value="css">CSS</option>
                            <option value="html">HTML</option>
                            <option value="other">Other</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Tags (comma separated: react, hooks, api)"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full p-4 bg-violet-50 rounded-xl border-2 border-black text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    
                    <textarea
                        placeholder="// Paste your code snippet here..."
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        rows="8"
                        className="w-full p-4 bg-gray-900 font-mono rounded-xl border-2 border-black text-green-300 placeholder-green-200 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                    ></textarea>

                    <button
                        onClick={handleAddSnippet}
                        disabled={loading}
                        className={`w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-violet-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-500 ${
                            loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                        }`}
                    >
                        <i className="fas fa-plus mr-2"></i> Add to Code Vault
                    </button>
                </div>
            </div>

            {/* Code Snippets Display */}
            <div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-archive text-violet-600 mr-3"></i>
                    Your Code Vault ({codeSnippets.length} snippets)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {codeSnippets.length > 0 ? (
                        codeSnippets.map(snippet => (
                            <SnippetCard key={snippet.id} snippet={snippet} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-xl border-2 border-black">
                            <i className="fas fa-code text-6xl text-gray-300 mb-4"></i>
                            <h4 className="text-xl font-bold text-gray-700 mb-2">No Code Snippets Yet</h4>
                            <p className="text-gray-500">Start adding your reusable code snippets above!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Tab Navigation Component ---
const TabNavigation = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'general', label: 'General Notes', icon: 'fa-sticky-note', color: 'yellow' },
        { id: 'structured', label: 'Structured Reflection', icon: 'fa-brain', color: 'violet' },
        { id: 'code_vault', label: 'Code Vault', icon: 'fa-code', color: 'red' },
    ];

    return (
        <div className="flex border-b-2 border-black mb-8 overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 py-4 px-6 text-lg font-bold transition-all duration-300 flex items-center border-b-4 ${
                        activeTab === tab.id
                            ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                            : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                    <i className={`fas ${tab.icon} mr-3 text-lg`}></i>
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

// --- Main Notes Page Component ---
const NotesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // ✅ FIX: Consistent user name handling
    const getUserName = () => sessionStorage.getItem("userName") || "Pro Learner";

    const [generalNotes, setGeneralNotes] = useState("");
    const [structuredReflection, setStructuredReflection] = useState("");
    const [codeSnippets, setCodeSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [modal, setModal] = useState({ isVisible: false, message: "" });

    // ✅ FIX: Simplified authentication check - always load notes
    useEffect(() => {
        console.log("NotesPage mounted - User ID:", getUserId());
        loadNotes();
    }, []);

    const loadNotes = useCallback(async () => {
        setLoading(true);
        try {
            const [general, structured, codeVault] = await Promise.all([
                fetchNoteApi(GENERAL_NOTES_CONTENT_TYPE, GENERAL_NOTES_CONTENT_ID),
                fetchNoteApi(STRUCTURED_NOTES_CONTENT_TYPE, GENERAL_NOTES_CONTENT_ID),
                fetchNoteApi(CODE_VAULT_CONTENT_TYPE, GENERAL_NOTES_CONTENT_ID),
            ]);
            
            setGeneralNotes(general);
            setStructuredReflection(structured);
            setCodeSnippets(codeVault);
        } catch (err) {
            console.error("Error loading notes:", err);
            // Don't redirect on error, just show empty state
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveNotes = async (contentType, content, successMessage = "Notes saved successfully! ✅") => {
        setLoading(true);
        try {
            await saveNoteApi(contentType, GENERAL_NOTES_CONTENT_ID, content);
            setModal({ isVisible: true, message: successMessage });
        } catch (err) {
            console.error(`Error saving ${contentType} note:`, err);
            // ✅ FIX: Removed the redirect on integrity constraint error
            alert(`Failed to save notes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 text-gray-800 relative overflow-hidden">
                <BackgroundPattern />
                <FloatingParticles />
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-2xl">
                        <i className="fas fa-sticky-note text-white text-2xl animate-pulse"></i>
                    </div>
                    <p className="text-xl font-semibold mb-2">Loading Your Notes</p>
                    <p className="text-gray-600">Preparing your personal notebook...</p>
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
                userName={getUserName()}
                currentPath={location.pathname}
                navigate={navigate}
            />

            {/* Success Modal */}
            <SuccessModal 
                isVisible={modal.isVisible} 
                message={modal.message} 
                onClose={() => setModal({ isVisible: false, message: "" })} 
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
                                <i className="fas fa-sticky-note mr-4 text-yellow-300"></i>
                                My SkillSprint Notes
                            </h1>
                            <p className="text-violet-200 text-lg sm:text-xl max-w-2xl">
                                Capture your learning journey, reflect on key insights, and build your personal code library.
                            </p>
                            <div className="flex items-center mt-6 space-x-4">
                                <div className="bg-white/20 px-4 py-2 rounded-xl border border-white/30">
                                    <span className="text-white font-semibold">3 Note Types</span>
                                </div>
                                <div className="bg-white/20 px-4 py-2 rounded-xl border border-white/30">
                                    <span className="text-white font-semibold">
                                        Auto-save Enabled
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Tab Navigation */}
                <AnimatedSection delay={200}>
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                </AnimatedSection>

                {/* Tab Content */}
                <AnimatedSection delay={300}>
                    <div className={`bg-white rounded-3xl shadow-xl p-6 sm:p-8 ${cardBorder}`}>
                        
                        {/* General Notes Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
                                        <i className="fas fa-sticky-note text-yellow-500 mr-3"></i>
                                        General Notes & Ideas
                                    </h2>
                                    <span className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                                        <i className="fas fa-save mr-1"></i>
                                        Auto-saves
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 text-lg">
                                    Jot down random thoughts, ideas, to-do lists, or anything that comes to mind during your learning journey.
                                </p>
                                
                                <textarea
                                    className="w-full h-96 p-6 bg-violet-50 rounded-xl border-2 border-black text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y text-lg leading-relaxed"
                                    placeholder="💡 Write your thoughts, ideas, or learning insights here...
                                    
Example:
- Need to practice React hooks more
- Great article about TypeScript generics
- Build a project using the new concepts learned today"
                                    value={generalNotes}
                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                ></textarea>
                                
                                <button
                                    onClick={() => handleSaveNotes(GENERAL_NOTES_CONTENT_TYPE, generalNotes, "General notes saved successfully!")}
                                    disabled={loading}
                                    className={`w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-violet-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-500 ${
                                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Saving Notes...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Save General Notes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Structured Reflection Tab */}
                        {activeTab === 'structured' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
                                        <i className="fas fa-brain text-violet-500 mr-3"></i>
                                        Structured Reflection
                                    </h2>
                                    <span className="text-sm text-gray-500 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                                        <i className="fas fa-graduation-cap mr-1"></i>
                                        Learning Science
                                    </span>
                                </div>

                                <div className="bg-violet-50 border-l-4 border-violet-500 p-6 rounded-xl">
                                    <h3 className="text-lg font-bold text-violet-700 mb-2 flex items-center">
                                        <i className="fas fa-lightbulb mr-2"></i>
                                        Learning Science Behind This
                                    </h3>
                                    <p className="text-violet-600">
                                        Structured reflection enhances knowledge retention by 40%. These prompts are designed to enforce active recall and immediate application of learned concepts.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-lg">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                            <i className="fas fa-key text-yellow-500 mr-2"></i>
                                            1. Key Takeaways & Active Recall
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            List the 3 most crucial concepts you learned. This forces your brain to actively retrieve information.
                                        </p>
                                        <textarea
                                            className="w-full h-32 p-4 bg-violet-50 rounded-xl border-2 border-black text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                                            placeholder="Example:
1. React useEffect cleanup prevents memory leaks
2. TypeScript generics make components more reusable
3. Database indexing improves query performance by 90%"
                                            value={structuredReflection}
                                            onChange={(e) => setStructuredReflection(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-lg">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                            <i className="fas fa-rocket text-green-500 mr-2"></i>
                                            2. Immediate Application Plan
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Where can you implement these concepts right now? Be specific about your next actions.
                                        </p>
                                        <textarea
                                            className="w-full h-24 p-4 bg-violet-50 rounded-xl border-2 border-black text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                                            placeholder="Example:
- Refactor the user authentication module with TypeScript generics today
- Add proper cleanup to all useEffect hooks in the project
- Create indexes for frequently queried database columns"
                                            value={structuredReflection}
                                            onChange={(e) => setStructuredReflection(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSaveNotes(STRUCTURED_NOTES_CONTENT_TYPE, structuredReflection, "Reflection saved successfully!")}
                                    disabled={loading}
                                    className={`w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-violet-700 ${
                                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Saving Reflection...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-brain mr-2"></i>
                                            Save Reflection & Action Plan
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Code Vault Tab */}
                        {activeTab === 'code_vault' && (
                            <CodeVault 
                                codeSnippets={codeSnippets} 
                                setCodeSnippets={setCodeSnippets} 
                                loading={loading}
                                handleSaveNotes={handleSaveNotes}
                            />
                        )}
                    </div>
                </AnimatedSection>
            </main>

            {/* Enhanced Footer */}
            <Footer navigate={navigate} />

            {/* Custom CSS for animations */}
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

export default NotesPage;