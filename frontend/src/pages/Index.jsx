import React, { useState, useEffect, useRef, useCallback } from "react";

// --- Custom Hook for Scroll Animation (Intersection Observer) ---
const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
    const ref = useRef(null);
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


// Utility for robust hover effect across all cards
const hoverLift =
    "transition duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:border-violet-300";

// --- AnimatedSection Component (Simple fade-up/in) ---
const AnimatedSection = ({ children, delay = 0, className = "" }) => {
    const [ref, inView] = useInView({ threshold: 0.1 });
    return (
        <div 
            ref={ref} 
            className={`transition-all duration-800 ease-out ${className} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// --- Motion.div Placeholder (Used for the Hero card/visual element) ---
const MotionDiv = ({ children, className = "" }) => {
    const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

    // Simple animation: slide in from the right and fade in
    const animationClass = inView ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-0 translate-x-12 rotate-2';

    return (
        <div ref={ref} className={`${className} transition-all duration-1000 ease-out ${animationClass}`}>
            {children}
        </div>
    );
};


// --- Components for Reusability and Clarity ---

/**
 * Feature Card Component
 * @param {object} feature - { icon, title, description, color }
 */
const FeatureCard = ({ feature, delay = 0 }) => {
    const [ref, inView] = useInView({ threshold: 0.15 });

    return (
        <div
            ref={ref}
            className={`group bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 transform cursor-pointer
                ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                ${hoverLift} transition-all duration-700
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${feature.color} flex items-center justify-center text-3xl mb-4 sm:mb-6 mx-auto transform group-hover:scale-110 transition-transform duration-300 text-white shadow-lg shadow-opacity-30 border-4 border-white/50`}
            >
                <i className={`fas ${feature.icon}`}></i>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 sm:mb-4">
                {feature.title}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
                {feature.description}
            </p>
        </div>
    )
};

/**
 * Course Card Component
 * @param {object} course - { title, duration, description, category, icon, color, accent }
 * @param {function} handleNavigate - Navigation handler
 */
const CourseCard = ({ course, index, handleNavigate }) => {
    const [ref, inView] = useInView({ threshold: 0.15 });

    return (
        <div
            ref={ref}
            className={`bg-white p-6 sm:p-8 rounded-3xl shadow-xl ${course.color} ${hoverLift} flex flex-col justify-between h-full transform transition-all duration-700
                ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl sm:text-2xl font-extrabold text-violet-800 leading-snug pr-4">
                        {course.title}
                    </h4>
                    <span
                        className={`${course.accent} px-3 py-1 text-xs rounded-full font-bold whitespace-nowrap ml-4 shadow-inner`}
                    >
                        {course.duration}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 flex items-center font-medium">
                    <i
                        className={`fas ${course.icon} mr-2 text-yellow-500`}
                    ></i>{" "}
                    {course.category}
                </p>
                <p className="text-gray-600 text-base leading-relaxed font-light">{course.description}</p>
            </div>
            <button
                className="mt-6 w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-500/40 hover:from-violet-700 hover:to-indigo-800 transition transform hover:scale-[1.01] hover:shadow-2xl"
                onClick={() => handleNavigate(`/sprint/${index + 1}`)}
            >
                Start Sprint <i className="fas fa-arrow-circle-right ml-2"></i>
            </button>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHeroLoaded, setIsHeroLoaded] = useState(false);

    useEffect(() => {
        // Simple logic to trigger the hero animation after mount
        setIsHeroLoaded(true);
    }, []);

    // 🔹 Handle both anchor scrolls and route navigation
    const handleNavigate = useCallback((path) => {
        if (path.startsWith("#")) {
            // Anchor scroll logic (Internal page navigation)
            const element = document.querySelector(path);
            if (element) {
                const offset = 90; // Account for fixed header height
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        } else if (path.startsWith("/")) {
            // ⭐️ ROUTING FIX: Use actual window navigation for demonstration/standalone context.
            // In a live React Router app, you would replace this with: useNavigate()(path);
            console.log(`ATTEMPTING NAVIGATION to: ${path}`);
            window.location.href = path;
        }
        setIsMenuOpen(false);
    }, []);

    const navLinks = [
        { name: "How It Works", path: "#process" },
        { name: "Features", path: "#features" },
        { name: "Sprints", path: "#courses" },
        { name: "About", path: "#about" },
        { name: "FAQ", path: "#faq" },
    ];

    const heroCta = () => handleNavigate("/Signup");

    // Data for Features Section
    const featuresData = [
        {
            icon: "fa-rocket",
            title: "Hyper-Focused Modules",
            description:
                "Eliminate wasted time with ultra-specific, single-topic sessions for immediate skill application.",
            color: "bg-gradient-to-br from-purple-500 to-indigo-600",
        },
        {
            icon: "fa-calendar-check",
            title: "60-Minute Habit",
            description:
                "Designed to fit into a lunch break. Dedicate just one hour to mastering a high-value concept.",
            color: "bg-gradient-to-br from-yellow-400 to-orange-500",
        },
        {
            icon: "fa-cubes",
            title: "Modular Skill Stacks",
            description:
                "Build complex competencies by stacking multiple 60-minute modules sequentially, one sprint at a time.",
            color: "bg-gradient-to-br from-teal-500 to-green-600",
        },
        {
            icon: "fa-code",
            title: "Interactive Sandboxes",
            description:
                "Every sprint includes a live coding environment and practical challenges to solidify knowledge immediately.",
            color: "bg-gradient-to-br from-red-500 to-pink-600",
        },
    ];

    // Data for Courses Section
    const coursesData = [
        {
            title: "Advanced TypeScript Utility Types",
            duration: "55 MIN",
            description:
                "Surgically master complex TypeScript utility types like `Partial`, `Pick`, and `Exclude` for cleaner, safer codebases.",
            category: "Frontend/Language",
            icon: "fa-terminal",
            color: "border-t-4 border-yellow-400",
            accent: "text-violet-900 bg-yellow-300",
        },
        {
            title: "Optimizing PostgreSQL Indices",
            duration: "60 MIN",
            description:
                "Deep dive into multi-column indexing, covering indexes, and query planning for massive performance gains.",
            category: "Backend & Data",
            icon: "fa-database",
            color: "border-t-4 border-purple-500",
            accent: "text-purple-600 bg-purple-100",
        },
        {
            title: "Tailwind CSS Customization Layer",
            duration: "45 MIN",
            description:
                "Go beyond utility classes. Learn theme extension, custom plugins, and mastering responsive breakpoints.",
            category: "Web Design/UI",
            icon: "fa-palette",
            color: "border-t-4 border-teal-500",
            accent: "text-teal-700 bg-teal-100",
        },
    ];

    // Data for FAQ Section
    const faqs = [
        {
            question: "What makes SkillSprint different from other platforms?",
            answer: "We focus on ultra-short, highly actionable modules (60 minutes max) designed for rapid skill acquisition and minimal procrastination. We prioritize active application over passive video viewing.",
        },
        {
            question: "Are the courses suitable for beginners?",
            answer: "Most sprints target intermediate and advanced users looking to fill specific gaps. However, we have 'Starter' paths designed to quickly onboard skilled beginners efficiently.",
        },
        {
            question: "How long is a 'Sprint' session?",
            answer: "A SkillSprint is typically structured around a 60-minute window, broken into short video lessons, interactive quizzes, and a final hands-on project that must be completed.",
        },
        {
            question: "Do I need any special software?",
            answer: "No. All technical sprints run within secure, browser-based code sandboxes. You only need a modern web browser and a stable internet connection.",
        }
    ];

    // Data for Process Section
    const processSteps = [
        {
            icon: "fa-search",
            title: "1. Identify Your Gap",
            description: "Pinpoint the precise, high-value skill or knowledge gap you need to fill, from React hooks to database indices.",
            color: "text-red-600",
            bg: "bg-red-50",
        },
        {
            icon: "fa-hourglass-half",
            title: "2. The 60-Minute Deep Dive",
            description: "Engage in our high-intensity, structured sprint content, completing interactive coding challenges along the way.",
            color: "text-yellow-600",
            bg: "bg-yellow-50",
        },
        {
            icon: "fa-check-circle",
            title: "3. Acquire & Apply",
            description: "Complete the mandatory final project, earn your proof of mastery, and immediately integrate the new skill into your work.",
            color: "text-green-600",
            bg: "bg-green-50",
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 antialiased overflow-x-hidden font-['Poppins', sans-serif]">
            {/* Load Font Awesome and Poppins Font */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            
            {/* 🚀 Navigation Bar (Fixed for smooth scrolling) */}
            <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-md transition-all duration-300">
                <nav className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* 🔹 Logo */}
                        <div
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => handleNavigate("#hero")}
                        >
                            <span className="text-3xl sm:text-4xl font-extrabold text-violet-700 tracking-tight flex items-center">
                                Skill<span className="text-indigo-900">Sprint</span> <i className="fas fa-bolt text-yellow-400 ml-2 text-2xl"></i>
                            </span>
                        </div>

                        {/* 🔹 Desktop Menu */}
                        <div className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.path}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNavigate(link.path);
                                    }}
                                    className="text-gray-700 font-medium text-lg hover:text-violet-600 transition duration-150 relative group px-2 py-1"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                </a>
                            ))}
                            {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                            <button
                                onClick={() => handleNavigate("/Login")}
                                className={`py-2 px-5 sm:px-6 border-2 border-violet-600 text-violet-600 rounded-full font-semibold text-base shadow-sm hover:bg-violet-50 transition duration-300 ${hoverLift.replace('hover:shadow-2xl', '')}`}
                            >
                                Log In
                            </button>
                            {/* **SIGNUP CTA** */}
                            <button
                                onClick={() => handleNavigate("/Signup")}
                                className={`py-2 px-5 sm:px-6 bg-yellow-400 text-violet-900 rounded-full font-bold shadow-md hover:bg-yellow-300 text-base shadow-yellow-400/40 ${hoverLift}`}
                            >
                                Start Free Sprint
                            </button>
                        </div>

                        {/* 🔹 Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
                            >
                                <i
                                    className={`fas ${
                                        isMenuOpen ? "fa-times" : "fa-bars"
                                    } text-2xl transition-transform duration-300`}
                                ></i>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* 🔹 Mobile Menu Dropdown */}
                <div
                    className={`lg:hidden absolute left-0 right-0 top-full bg-white shadow-2xl border-t border-gray-200 transform transition-all duration-300 ease-in-out ${
                        isMenuOpen
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-4 pointer-events-none"
                    }`}
                >
                    <div className="px-4 py-4 flex flex-col space-y-3">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.path}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavigate(link.path);
                                }}
                                className="block text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-violet-50 transition text-lg text-center"
                            >
                                {link.name}
                            </a>
                        ))}
                        <div className="flex space-x-4 pt-2">
                            {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                            <button
                                onClick={() => handleNavigate("/Login")}
                                className="flex-1 py-3 border border-violet-600 text-violet-600 rounded-full font-semibold text-base transition hover:bg-violet-50"
                            >
                                Log In
                            </button>
                            {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                            <button
                                onClick={() => handleNavigate("/Signup")}
                                className="flex-1 py-3 bg-yellow-400 text-violet-900 rounded-full font-bold text-base hover:bg-yellow-300 transition"
                            >
                                Sign Up Free
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 🌟 Hero Section (Wider and more impactful) */}
            <section id="hero" className="relative bg-gradient-to-br from-violet-800 to-indigo-900 pt-24 pb-32 sm:pt-36 sm:pb-48 lg:pt-48 lg:pb-64 overflow-hidden">
                {/* Geometric Pattern */}
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
                
                {/* Decorative Bottom Curve for separation */}
                <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 overflow-hidden">
                    <svg
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                    >
                        <path
                            fill="#f9fafb"
                            d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,74.7C1120,75,1280,53,1360,42.7L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
                        ></path>
                    </svg>
                </div>

                {/* Hero Content Grid */}
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-white relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Text and CTA (Order-first on mobile is now natural) */}
                    <div className="lg:col-span-7 xl:col-span-7 text-center lg:text-left lg:order-first">
                        <div
                            className={`transition-all duration-1000 ease-out delay-300 ${
                                isHeroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            }`}
                        >
                            <span className="inline-block bg-yellow-400/20 text-yellow-300 text-xs sm:text-sm font-semibold rounded-full px-4 py-1.5 mb-6 uppercase tracking-widest border border-yellow-400/50 shadow-inner">
                                The Cognitive Efficiency Learning Model
                            </span>

                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-5 sm:mb-8 drop-shadow-2xl">
                                Master <span className="text-yellow-400">High-Value Skills</span> in{" "}
                                <span className="block sm:inline">60-Minute Sprints</span>
                            </h1>

                            <p className="max-w-xl lg:max-w-none text-lg sm:text-xl lg:text-2xl mb-10 sm:mb-12 opacity-90 font-light mx-auto lg:mx-0">
                                Designed for the modern professional: SkillSprint delivers deep, actionable knowledge in the time it takes for a lunch break. Focus purely on mastery through intense practice.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-6">
                                <button
                                onClick={() => handleNavigate("/Signup")}
                                    className={`py-3.5 px-8 sm:py-4 sm:px-10 lg:px-12 bg-yellow-400 text-violet-900 rounded-full text-base sm:text-lg lg:text-xl font-bold shadow-2xl shadow-yellow-400/50 hover:bg-yellow-300 ${hoverLift}`}
                                >
                                    Start Your First Sprint <i className="fas fa-running ml-2"></i>
                                </button>
                                <button
                                    onClick={() => handleNavigate("#courses")}
                                    className={`py-3.5 px-8 sm:py-4 sm:px-10 lg:px-12  border-2 border-yellow-400 text-black rounded-full text-base sm:text-lg lg:text-xl font-bold hover:bg-white/10 ${hoverLift}`}
                                >
                                    Explore Catalog <i className="fas fa-arrow-down ml-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Visual Card (FIXED: Removed order-first to place it below text on mobile) */}
                    <div className="lg:col-span-5 xl:col-span-5 lg:order-last mt-16 lg:mt-0 max-w-md mx-auto">
                        <MotionDiv className="h-full">
                            <div className="relative transform hover:scale-[1.03] transition-transform duration-500 rounded-3xl bg-white/95 p-6 sm:p-8 shadow-2xl shadow-indigo-900/50 border border-gray-100">
                                <div className="absolute -top-6 -right-8 w-20 h-20 bg-yellow-400 rounded-full opacity-30 blur-2xl"></div>
                                <div className="absolute -bottom-8 -left-6 w-28 h-28 bg-pink-400 rounded-full opacity-20 blur-3xl"></div>

                                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-inner">
                                    <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium tracking-wide">Next Sprint: Live Coding</div>
                                            <div className="text-lg font-extrabold text-violet-800">React Hooks — Starter Kit</div>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">55 MIN</div>
                                    </div>

                                    <div className="text-sm text-gray-600 leading-relaxed mb-4">
                                        Focus: Master `useState` and `useEffect` with a portfolio-ready project. Hands-on tasks and final code review included.
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs font-semibold"><i className="fas fa-laptop-code mr-1"></i> Practice Required</div>
                                        <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs font-semibold"><i className="fas fa-certificate mr-1"></i> Certification</div>
                                    </div>

                                    <div className="mt-6 flex items-center gap-3">
                                        {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                                        <button onClick={() => handleNavigate("/Signup")} className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-base font-bold shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition duration-300">
                                            Launch Sprint
                                        </button>
                                        <button onClick={() => handleNavigate("#courses")} className="py-3 px-4 bg-yellow-400 text-black border border-orange-300 rounded-xl text-sm font-semibold hover:bg-gray-100 transition duration-300">
                                            Syllabus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </MotionDiv>
                    </div>
                </div>
            </section>

            {/* ⚙️ How It Works (Process Section) */}
            <section id="process" className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block rounded-full px-4 py-2 text-sm font-bold bg-violet-100 text-violet-700 mb-4 uppercase tracking-wider">
                            Methodology
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                            The Path to Skill Mastery in 3 Simple Steps
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light">
                            Our unique curriculum is engineered for deep focus, maximizing retention and minimizing mental fatigue using proven learning science.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
                        {/* Connecting Line (Desktop only) */}
                        <div className="hidden md:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-1 bg-gray-200 z-0 mx-20"></div>

                        {processSteps.map((step, index) => (
                            <AnimatedSection key={index} delay={index * 250} className="text-center relative z-10">
                                <div className={`p-8 rounded-3xl shadow-xl bg-white ${hoverLift} h-full border border-gray-100`}>
                                    <div className={`w-18 h-18 ${step.bg} rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg ${step.shadow}`}>
                                        <i className={`fas ${step.icon} ${step.color} text-3xl`}></i>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-4">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed font-normal">
                                        {step.description}
                                    </p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* 💡 Features Section (Enhanced Grid) */}
            <section id="features" className="py-20 sm:py-28 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                    <AnimatedSection>
                        <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-700 mb-4 uppercase tracking-wider">
                            Key Differentiators
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Features Engineered for Maximum Retention
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-12 lg:mb-16 max-w-4xl mx-auto font-light">
                            We don't just teach—we facilitate permanent skill integration. Our platform is built on principles of spaced repetition and active recall.
                        </p>
                    </AnimatedSection>

                    {/* Fully Responsive Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
                        {featuresData.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} delay={index * 150} />
                        ))}
                    </div>
                </div>
            </section>

            {/* 📚 Courses Preview (Sprints Section) */}
            <section id="courses" className="py-20 sm:py-28 bg-violet-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 mb-4 uppercase tracking-wider">
                            Curated Sprints
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Featured Tech & Development Sprints
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto font-light">
                            A selection of our most popular 60-minute deep dives in high-demand technologies for immediate career impact.
                        </p>
                    </div>

                    {/* Course Grid (Responsive) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                        {coursesData.map((course, index) => (
                            <CourseCard key={index} course={course} index={index} handleNavigate={handleNavigate} />
                        ))}
                    </div>

                    <div className="text-center mt-12 sm:mt-16">
                        <button
                            onClick={() => handleNavigate("/catalog")}
                            className={`py-3.5 px-10 sm:py-4 sm:px-12 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-full text-base sm:text-lg font-bold shadow-xl shadow-violet-500/40 hover:from-violet-700 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300`}
                        >
                            View Full Catalog (100+ Sprints)
                            <i className="fas fa-book-open ml-2"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* 🏢 About Us Section */}
            <section id="about" className="py-20 sm:py-28 bg-gradient-to-br from-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        
                        {/* Text Content */}
                        <AnimatedSection>
                            <span className="inline-block rounded-full px-4 py-2 text-sm font-bold bg-blue-100 text-blue-700 mb-6 uppercase tracking-wider shadow-sm">
                                Our Mission
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                                Revolutionizing Online Education Through Focused Learning
                            </h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed font-normal">
                                Traditional online courses are plagued by low completion rates and information overload. At SkillSprint, we believe true mastery comes from focused, intense effort rather than passive consumption of lengthy content.
                            </p>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed font-normal">
                                Our 60-Minute Sprint methodology is built on proven cognitive science principles. Each course delivers one specific, actionable skill through interactive content, hands-on exercises, and immediate practical application—eliminating procrastination and ensuring real progress.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                                <button
                                onClick={() => handleNavigate("/Login")}
                                    className={`py-4 px-8 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
                                >
                                    Join 50,000+ Learners
                                </button>
                                <button
                                    onClick={() => handleNavigate("#courses")}
                                    className={`py-4 px-8 border-2 border-violet-600 text-violet-600 rounded-xl font-bold text-lg hover:bg-violet-50 transition-all duration-300`}
                                >
                                    View Learning Paths
                                </button>
                            </div>
                        </AnimatedSection>

                        {/* Stats Grid */}
                        <AnimatedSection delay={200}>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-violet-500 text-center transform hover:scale-[1.02] transition-all duration-300">
                                    <div className="text-4xl font-extrabold text-violet-700 mb-2">95%</div>
                                    <div className="text-gray-700 font-semibold">Completion Rate</div>
                                    <div className="text-sm text-gray-500 mt-2">vs industry avg 15%</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-yellow-500 text-center transform hover:scale-[1.02] transition-all duration-300">
                                    <div className="text-4xl font-extrabold text-violet-700 mb-2">50K+</div>
                                    <div className="text-gray-700 font-semibold">Active Learners</div>
                                    <div className="text-sm text-gray-500 mt-2">Global community</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-teal-500 text-center transform hover:scale-[1.02] transition-all duration-300">
                                    <div className="text-4xl font-extrabold text-violet-700 mb-2">500+</div>
                                    <div className="text-gray-700 font-semibold">Skill Sprints</div>
                                    <div className="text-sm text-gray-500 mt-2">Highly relevant, updated monthly</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-pink-500 text-center transform hover:scale-[1.02] transition-all duration-300">
                                    <div className="text-4xl font-extrabold text-violet-700 mb-2">4.9/5</div>
                                    <div className="text-gray-700 font-semibold">Satisfaction Score</div>
                                    <div className="text-sm text-gray-500 mt-2">Based on 10K+ verified reviews</div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* ❓ FAQ Section (Accordion with Animation) */}
            <section id="faq" className="py-20 sm:py-28 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold bg-yellow-100 text-yellow-700 mb-4 uppercase tracking-wider">
                            Q & A
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                            Common Questions & Clarity
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed font-light">
                            Everything you need to know about the SkillSprint learning model and platform access.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => {
                            const [ref, inView] = useInView({ threshold: 0.1 });
                            const [isOpen, setIsOpen] = useState(false);
                            
                            return (
                                <div
                                    key={index}
                                    ref={ref}
                                    className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-700 ${
                                        inView ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
                                    }`}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="w-full p-5 sm:p-6 text-left flex items-start justify-between hover:bg-violet-50 transition-colors duration-300 focus:outline-none"
                                    >
                                        <div className="flex items-start space-x-4 flex-1">
                                            <i className="fas fa-question-circle text-violet-600 text-xl flex-shrink-0 mt-0.5"></i>
                                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <i className={`fas fa-chevron-down text-violet-600 text-lg flex-shrink-0 ml-4 transform transition-transform duration-300 ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}></i>
                                    </button>
                                    
                                    <div className={`grid transition-all duration-500 ease-in-out ${
                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}>
                                        <div className="overflow-hidden">
                                            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed pl-8 pt-2 border-t border-violet-100 font-light">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => handleNavigate("/contact")}
                            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
                        >
                            Contact Support Team
                            <i className="fas fa-headset ml-2"></i>
                        </button>
                    </div>
                </div>
            </section>
            
            {/* 👨‍💼 Team Section (Reused/Refined structure) */}
            <section id="team" className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold bg-violet-100 text-violet-700 mb-4 uppercase tracking-wider">
                            The Innovators
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Meet Our Curriculum Architects
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto font-light">
                            A dedicated team of developers, learning scientists, and industry experts committed to delivering quality, efficient education.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 max-w-6xl mx-auto">
                        {/* Member 1: Alex Johnson */}
                        <AnimatedSection delay={0}>
                            <div className="bg-gray-50 rounded-2xl shadow-xl p-8 text-center transform hover:shadow-purple-200 hover:shadow-2xl transition-all duration-500 border border-gray-100">
                                <div className="text-5xl mb-4">👨‍💻</div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Alex Johnson</h3>
                                <p className="text-purple-600 font-semibold text-base mb-3">Founder & Chief Learning Officer</p>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed font-light">Pioneered the 60-minute methodology. Passionate about de-cluttering the learning process.</p>
                                <div className="flex justify-center space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-twitter text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-linkedin-in text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-github text-xl"></i></a>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Member 2: Sarah Chen */}
                        <AnimatedSection delay={150}>
                            <div className="bg-gray-50 rounded-2xl shadow-xl p-8 text-center transform hover:shadow-purple-200 hover:shadow-2xl transition-all duration-500 border border-gray-100">
                                <div className="text-5xl mb-4">👩‍🏫</div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sarah Chen</h3>
                                <p className="text-purple-600 font-semibold text-base mb-3">Director of Curriculum Development</p>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed font-light">Learning scientist focused on cognitive load reduction and memory consolidation techniques.</p>
                                <div className="flex justify-center space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-twitter text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-linkedin-in text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fas fa-flask text-xl"></i></a>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Member 3: Mike Rodriguez */}
                        <AnimatedSection delay={300}>
                            <div className="bg-gray-50 rounded-2xl shadow-xl p-8 text-center transform hover:shadow-purple-200 hover:shadow-2xl transition-all duration-500 border border-gray-100">
                                <div className="text-5xl mb-4">👨‍🎨</div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Mike Rodriguez</h3>
                                <p className="text-purple-600 font-semibold text-base mb-3">Lead Product & UX Designer</p>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed font-light">Ensures the platform is intuitive, engaging, and maintains a clean, distraction-free environment.</p>
                                <div className="flex justify-center space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-dribbble text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-behance text-xl"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors duration-300"><i className="fab fa-linkedin-in text-xl"></i></a>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* 📞 Call to Action (Final Conversion Block) */}
            <section className="bg-violet-900 py-16 sm:py-24 lg:py-32 text-center text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 leading-snug drop-shadow-lg">
                        <i className="fas fa-cogs text-yellow-400 mr-3"></i> Stop Planning. <span className="text-yellow-400 block sm:inline">Start Coding.</span>
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 lg:mb-12 text-violet-200 max-w-4xl mx-auto font-light">
                        Join the thousands of developers upgrading their skill set one focused, high-impact hour at a time. Your next promotion is 60 minutes away.
                    </p>
                    {/* **LOGIN/SIGNUP REDIRECTION/ROUTING** */}
                    <button
                        onClick={heroCta}
                        className={`py-3.5 px-10 sm:py-4 sm:px-12 bg-yellow-400 text-violet-900 rounded-full text-base sm:text-lg lg:text-xl font-bold shadow-2xl shadow-yellow-400/50 hover:bg-yellow-300 transform hover:scale-105 transition duration-500`}
                    >
                        Create Your Free SkillSprint Account
                        <i className="fas fa-chevron-right ml-2 sm:ml-3"></i>
                    </button>
                </div>
            </section>

            {/* 🦶 Footer */}
            <footer className="bg-gray-900 text-white py-10 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10 mb-10 border-b border-gray-700/50 pb-8">
                        
                        {/* Logo and Tagline */}
                        <div className="col-span-full md:col-span-2 lg:col-span-2 text-center md:text-left">
                            <div className="text-3xl font-extrabold text-yellow-400 mb-3">
                                SkillSprint
                            </div>
                            <p className="text-sm text-gray-400 max-w-sm mx-auto md:mx-0 leading-relaxed font-light">
                                The future of micro-learning. Mastery in the time you have.
                            </p>
                            <div className="text-2xl space-x-5 flex justify-center md:justify-start mt-6">
                                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 transform hover:scale-110 transition"><i className="fab fa-twitter"></i></a>
                                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transform hover:scale-110 transition"><i className="fab fa-linkedin-in"></i></a>
                                <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transform hover:scale-110 transition"><i className="fab fa-github"></i></a>
                            </div>
                        </div>
                        
                        {/* Platform Links */}
                        <div className="text-center md:text-left">
                            <h4 className="font-semibold text-white mb-4 text-lg">Platform</h4>
                            <div className="flex flex-col space-y-2">
                                {navLinks.map(link => (
                                    <a 
                                        key={link.name} 
                                        href={link.path} 
                                        onClick={(e) => {e.preventDefault(); handleNavigate(link.path);}}
                                        className="text-gray-400 hover:text-white text-sm transition font-light"
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <a 
                                    href="/catalog" 
                                    onClick={(e) => {e.preventDefault(); handleNavigate('/catalog');}}
                                    className="text-gray-400 hover:text-white text-sm transition font-light"
                                >
                                    Full Catalog
                                </a>
                            </div>
                        </div>

                        {/* Company & Legal */}
                        <div className="text-center md:text-left">
                            <h4 className="font-semibold text-white mb-4 text-lg">Company</h4>
                            <div className="flex flex-col space-y-2">
                                <a href="#about" onClick={(e) => {e.preventDefault(); handleNavigate('#about');}} className="text-gray-400 hover:text-white text-sm transition font-light">
                                    About Us
                                </a>
                                <a href="#team" onClick={(e) => {e.preventDefault(); handleNavigate('#team');}} className="text-gray-400 hover:text-white text-sm transition font-light">
                                    Our Team
                                </a>
                                <a href="#privacy" onClick={(e) => handleNavigate('/privacy')} className="text-gray-400 hover:text-white text-sm transition font-light">
                                    Privacy Policy
                                </a>
                                <a href="#terms" onClick={(e) => handleNavigate('/terms')} className="text-gray-400 hover:text-white text-sm transition font-light">
                                    Terms of Service
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 text-center">
                        <p className="text-xs sm:text-sm text-gray-500 font-light">
                            © {new Date().getFullYear()} SkillSprint Global. All rights reserved. | Optimized for the focused professional.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;