import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Tailwind CSS utility class for hover effects
const hoverLift = "transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl";

// Constants
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// --- Success Modal Component for Admin Login ---
const AdminSuccessModal = ({ isOpen, adminName, onRedirect }) => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (isOpen) {
            setCountdown(3);
            // Redirect timer
            const redirectTimer = setTimeout(onRedirect, 3000);
            
            // Countdown interval
            const interval = setInterval(() => {
                setCountdown(prev => (prev > 1 ? prev - 1 : 0));
            }, 1000);

            return () => {
                clearTimeout(redirectTimer);
                clearInterval(interval);
            };
        }
    }, [isOpen, onRedirect]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-violet-700/30 transform scale-100 transition-all duration-300 relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-700/10 blur-xl -z-10"></div>
                
                <div className="text-7xl mb-4 text-yellow-400">
                    <i className="fas fa-user-shield animate-pulse"></i>
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                    Welcome, {adminName}!
                </h3>
                <p className="text-gray-300 mb-6">Access granted to Admin Dashboard.</p>
                
                <p className="text-base font-semibold text-violet-400">
                    Redirecting in {countdown} seconds...
                </p>
                <div className="mt-4 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-1000 ease-linear" 
                        style={{ width: `${(countdown / 3) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// --- Responsive Back Button Component ---
const BackButton = ({ className, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center text-gray-300 hover:text-white transition-colors font-medium text-sm lg:text-base z-10 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-gray-700 ${className}`}
    >
        <i className="fas fa-arrow-left mr-2"></i> Back to Home
    </button>
);

// --- Core Admin Login Component ---
const AdminLogin = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    
    const [message, setMessage] = useState(""); 
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const [errors, setErrors] = useState({});
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminName] = useState("Super Admin");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
        setMessage(""); 
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.username.trim()) {
            newErrors.username = "Username is required.";
        }

        if (!formData.password) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleRedirectToDashboard = useCallback(() => {
        setIsModalOpen(false);
        // Set authentication flag in sessionStorage
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        // Navigate to admin dashboard using React Router
        navigate('/admin_dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setErrors({});

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            if (formData.username === ADMIN_USERNAME && formData.password === ADMIN_PASSWORD) {
                // Show success modal which will handle the redirect
                setIsModalOpen(true);
                setFormData({ username: "", password: "" });
            } else {
                setMessage("Invalid admin credentials. Please check your username and password.");
            }
            setIsLoading(false);
        }, 1000);
    };
    
    // Admin features content
    const adminFeatures = [
        { icon: "fa-chart-line", text: "Analytics Dashboard", detail: "Monitor platform performance and user engagement metrics." },
        { icon: "fa-users-cog", text: "User Management", detail: "Manage user accounts, permissions, and access levels." },
        { icon: "fa-cog", text: "System Configuration", detail: "Configure platform settings and security parameters." },
        { icon: "fa-database", text: "Data Management", detail: "Access and manage all platform data and content." },
    ];

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            
            <AdminSuccessModal 
                isOpen={isModalOpen} 
                adminName={adminName}
                onRedirect={handleRedirectToDashboard} 
            />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950 px-4 sm:px-6 lg:px-8 font-['Inter'] relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
                </div>

                {/* --- Back Button for Large Screens (Top Right) --- */}
                <BackButton
                    onClick={() => navigate('/')}
                    className="hidden lg:flex absolute top-6 right-6" 
                />

                {/* Main Container - Optimized for 1440x900 */}
                <div className="w-full max-w-8xl mx-auto bg-gray-900/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-violet-700/30 relative z-10">
                    {/* Grid Layout - 4 columns with proper distribution */}
                    <div className="grid grid-cols-1 xl:grid-cols-4">
                        
                        {/* 1. Right Side - Login Form - Takes 2 columns (FORM FIRST ON MOBILE) */}
                        <div className="xl:col-span-2 p-8 lg:p-12 xl:p-16 flex items-center justify-center order-first xl:order-last">
                            <div className="w-full max-w-md xl:max-w-lg mx-auto">
                                <div className="text-center mb-8 lg:mb-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
                                        <i className="fas fa-lock text-2xl text-white"></i>
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                                        Admin Access
                                    </h2>
                                    <p className="text-gray-400 text-base lg:text-lg font-light">
                                        Verify your identity to continue
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6 lg:space-y-8">
                                    
                                    {/* Username Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                                            <i className="fas fa-user mr-2 text-violet-400"></i>
                                            Admin Username
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Enter admin username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-800/70 px-4 lg:px-5 py-3 lg:py-4 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/30 focus:border-violet-500 text-white placeholder-gray-500 text-base lg:text-lg transition-all duration-300 ${
                                                errors.username ? "border-red-500" : "border-gray-700 hover:border-violet-500/50"
                                            }`}
                                        />
                                        {errors.username && (
                                            <p className="text-red-400 text-sm mt-2 font-medium flex items-center">
                                                <i className="fas fa-exclamation-circle mr-2"></i>
                                                {errors.username}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                                            <i className="fas fa-key mr-2 text-violet-400"></i>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter admin password"
                                                className={`w-full bg-gray-800/70 px-4 lg:px-5 py-3 lg:py-4 border-2 rounded-xl focus:ring-4 focus:ring-violet-500/30 focus:border-violet-500 text-white placeholder-gray-500 text-base lg:text-lg pr-12 transition-all duration-300 ${
                                                    errors.password ? "border-red-500" : "border-gray-700 hover:border-violet-500/50"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-violet-400 text-lg transition-colors duration-300"
                                            >
                                                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-red-400 text-sm mt-2 font-medium flex items-center">
                                                <i className="fas fa-exclamation-circle mr-2"></i>
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 lg:py-4 px-6 lg:px-8 rounded-xl font-bold text-lg lg:text-xl text-white transition-all duration-300 ${hoverLift} ${
                                            isLoading
                                                ? "bg-gray-700 cursor-not-allowed"
                                                : "bg-gradient-to-r from-violet-600 to-indigo-700 shadow-2xl shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-800 hover:shadow-violet-600/40"
                                            }`}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 lg:h-6 w-5 lg:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Authenticating...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center">
                                                <i className="fas fa-sign-in-alt mr-3"></i>
                                                Access Dashboard
                                            </span>
                                        )}
                                    </button>
                                </form>

                                {/* Error Message Display */}
                                {message && !isModalOpen && (
                                    <div className="mt-6 lg:mt-8 p-4 lg:p-5 rounded-xl text-center font-medium border-2 bg-red-900/30 text-red-300 border-red-700/50">
                                        <i className="fas fa-exclamation-triangle mr-2 text-lg"></i>
                                        {message}
                                    </div>
                                )}
                                
                                {/* --- Back Button for Mobile/Tablet --- */}
                                <div className="mt-8 lg:mt-10 text-center xl:hidden">
                                    <BackButton
                                        onClick={() => navigate('/')}
                                        className="inline-flex w-auto py-3 px-6 text-base"
                                    />
                                </div>

                                {/* Footer */}
                                <div className="mt-8 lg:mt-12 pt-6 border-t border-gray-700/50">
                                    <p className="text-center text-gray-500 text-sm">
                                        <i className="fas fa-shield-check mr-2 text-violet-400"></i>
                                        &copy; {new Date().getFullYear()} SkillSprint Admin Panel • Secure Access
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Left Side - Admin Features - Takes 2 columns (FEATURES SECOND ON MOBILE) */}
                        <div className="xl:col-span-2 bg-gradient-to-br from-violet-800 to-indigo-900 text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-center order-last xl:order-first">
                            <div className="mb-8 lg:mb-12">
                                <div className="flex items-center mb-6">
                                    <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-violet-900 shadow-2xl mr-5">
                                        <i className="fas fa-user-shield text-2xl"></i>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight">
                                            Admin <span className="text-yellow-400">Portal</span>
                                        </h1>
                                        <p className="text-violet-200 text-lg xl:text-xl font-light mt-3">
                                            Secure access to administrative controls and system management
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid - 2x2 layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
                                {adminFeatures.map((item, index) => (
                                    <div key={index} className="flex items-start space-x-4 group hover:bg-violet-700/30 p-4 rounded-2xl transition-all duration-300">
                                        <div className="w-12 h-12 flex-shrink-0 bg-yellow-400 rounded-xl flex items-center justify-center text-violet-900 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                            <i className={`fas ${item.icon} text-lg`}></i>
                                        </div>
                                        <div className='flex-1'>
                                            <span className="text-lg xl:text-xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300">
                                                {item.text}
                                            </span>
                                            <p className="text-violet-200 text-sm xl:text-base font-light mt-2">
                                                {item.detail}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-12 pt-6 border-t border-violet-600/50">
                                <p className="text-violet-300 text-sm font-light flex items-center">
                                    <i className="fas fa-shield-alt mr-3 text-lg"></i>
                                    Restricted access. Authorized personnel only. All activities are monitored.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;