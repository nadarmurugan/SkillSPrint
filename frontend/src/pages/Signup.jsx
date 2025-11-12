import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Tailwind CSS utility class for hover lift effect
const hoverLift = "transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl";

// --- Success Modal Component (Unchanged) ---
const SuccessModal = ({ isOpen, message, onRedirect }) => {
    const [countdown, setCountdown] = useState(3);

    React.useEffect(() => {
        if (isOpen) {
            setCountdown(3); 
            const redirectTimer = setTimeout(onRedirect, 3000); 
            
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center border-t-4 border-violet-600 transform scale-100 transition-all duration-300">
                <div className="text-5xl mb-4">
                    <i className="fas fa-check-circle text-violet-600"></i>
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Account Created!</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                
                <p className="text-base font-semibold text-violet-600">
                    Redirecting to Login in {countdown} seconds...
                </p>
                <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-violet-500 transition-all duration-1000 ease-linear" 
                        style={{ width: `${(countdown / 3) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// --- Main Signup Component ---
const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });
    
    // 'message' is now only used for network/server-side errors
    const [message, setMessage] = useState(""); 
    const [isLoading, setIsLoading] = useState(false);
    // This is the one and only password eye toggle state
    const [showPassword, setShowPassword] = useState(false); 
    const [errors, setErrors] = useState({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

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
        
        // Name Validation
        if (!formData.name.trim()) {
            newErrors.name = "Full name is required.";
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email address is invalid.";
        }

        // --- ENHANCED PASSWORD VALIDATION ---
        const password = formData.password;
        if (!password) {
            newErrors.password = "Password is required.";
        } else if (password.length < 8) {
            newErrors.password = "Must be at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            newErrors.password = "Must include at least one uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            newErrors.password = "Must include at least one lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            newErrors.password = "Must include at least one number.";
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            // Checks for common special characters
            newErrors.password = "Must include at least one special character.";
        }
        // -----------------------------------

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleRedirectToLogin = useCallback(() => {
        setIsModalOpen(false);
        navigate("/login");
    }, [navigate]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setMessage("");
        setModalMessage(""); 
        setErrors({});

        if (!validateForm()) {
            // Removed the redundant general error message here:
            // setMessage("Please fix the validation errors and try again.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:5050/signup", {
                name: formData.name.trim(),
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
            });

            const successMessage = res.data.message || "Registration successful! Your SkillSprint is ready.";
            setModalMessage(successMessage);
            setIsModalOpen(true);
            setFormData({ name: "", email: "", password: "" });

        } catch (err) {
            console.error("Signup error:", err);
            // This message is for network/server errors only now
            setMessage(err.response?.data?.error || "Signup failed. A user with this email might already exist.");
        } finally {
            setIsLoading(false);
        }
    };

    const informativeContent = [
        { icon: "fa-terminal", text: "Interactive Sandboxes", detail: "Practice immediately in a secure, real-time coding environment." },
        { icon: "fa-graduation-cap", text: "Certified Mastery Path", detail: "Gain proof of skill with completion badges for every focused module." },
        { icon: "fa-rocket", text: "Hyper-Focused Sprints", detail: "Eliminate distractions and achieve rapid learning goals in 60 minutes or less." },
    ];

    // Responsive Back Button Component
    const BackButton = ({ className, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center text-violet-600 hover:text-indigo-800 transition-colors font-medium text-sm lg:text-base z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-gray-200 ${className}`}
        >
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </button>
    );

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            
            <SuccessModal 
                isOpen={isModalOpen} 
                message={modalMessage} 
                onRedirect={handleRedirectToLogin} 
            />

  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-['Poppins']">
  <div className="max-w-8xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
    {/* your signup content here */}
                    {/* --- Back Button for Large Screens (Top Right) --- */}
                    {/* One instance of BackButton for large screens, as intended */}
                    <BackButton
                        onClick={() => navigate("/")}
                        className="hidden lg:flex absolute top-6 right-6" 
                    />

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        
                        {/* Right Side - Form (Order 2 on desktop) */}
                        <div className="lg:col-span-3 p-6 sm:p-8 lg:p-12 flex items-center justify-center order-1 lg:order-2">
                            <div className="max-w-md w-full mx-auto">
                                <div className="text-center lg:text-left mb-8">
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
                                        Create Account
                                    </h2>
                                    <p className="text-gray-600 text-base lg:text-lg font-light">
                                        Get access to the free starter sprints immediately.
                                    </p>
                                </div>

                                <form onSubmit={handleSignup} className="space-y-6">
                                    
                                    {/* Name Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-violet-200 focus:border-violet-600 transition-shadow duration-300 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        {errors.name && (<p className="text-red-500 text-sm mt-1 font-medium">{errors.name}</p>)}
                                    </div>

                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="your.email@skillsprint.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-violet-200 focus:border-violet-600 transition-shadow duration-300 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                                        />
                                        {errors.email && (<p className="text-red-500 text-sm mt-1 font-medium">{errors.email}</p>)}
                                    </div>

                                    {/* Password Input */}
                                 {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="At least 8 characters with symbols"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-violet-200 focus:border-violet-600 pr-10 transition ${errors.password ? "border-red-500" : "border-gray-300"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600"
                      >
                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 px-6 rounded-xl font-bold text-lg text-white transition-all duration-300 ${hoverLift} ${
                                            isLoading
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/50 hover:from-violet-700 hover:to-indigo-800"
                                            }`}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Creating Account...
                                            </span>
                                        ) : (
                                            <span>Create Account <i className="fas fa-arrow-right ml-2"></i></span>
                                        )}
                                    </button>
                                </form>

                                {/* Error Message Display (General) - Only for network/server errors now */}
                                {message && !isModalOpen && (
                                    <div className="mt-6 p-4 rounded-xl text-center font-medium border bg-red-100 text-red-700 border-red-300">
                                        {message}
                                    </div>
                                )}

                                {/* Login Link */}
                                <div className="mt-6 text-center text-gray-600 text-sm lg:text-base">
                                    Already have an account?{" "}
                                    <button
                                        onClick={() => navigate("/login")}
                                        className="text-violet-600 font-semibold hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        Log In
                                    </button>
                                </div>
                                
                                {/* --- Back Button for Mobile/Tablet (Below Login Link) --- */}
                                {/* Another instance of BackButton for mobile screens, as intended */}
                                <div className="mt-6 text-center lg:hidden">
                                    <BackButton
                                        onClick={() => navigate("/")}
                                        className="inline-flex w-auto"
                                    />
                                </div>


                                {/* Terms Notice */}
                                <div className="mt-6 text-center text-xs text-gray-500">
                                    By clicking "Create Account," you agree to our <a href="#" className="underline hover:text-violet-600">Terms of Service</a> and <a href="#" className="underline hover:text-violet-600">Privacy Policy</a>.
                                </div>
                            </div>
                        </div>

                        {/* Left Side - Informative Content (Order 1 on desktop) */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-violet-700 to-indigo-900 text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1">
                            <div className="mb-6 lg:mb-10">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 lg:mb-4 leading-tight">
                                    Start Your <span className="text-yellow-400">SkillSprint</span> Journey
                                </h1>
                                <p className="text-violet-200 text-base lg:text-lg font-light">
                                    Unlock hyper-focused mastery with the world's most efficient learning platform.
                                </p>
                            </div>

                            <div className="space-y-4 lg:space-y-6">
                                {informativeContent.map((item, index) => (
                                    <div key={index} className="flex items-start space-x-3 lg:space-x-4">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0 bg-yellow-400 rounded-full flex items-center justify-center text-violet-900 shadow-xl mt-1">
                                            <i className={`fas ${item.icon} text-sm lg:text-lg`}></i>
                                        </div>
                                        <div className='flex-1'>
                                            <span className="text-lg lg:text-xl font-semibold">{item.text}</span>
                                            <p className="text-violet-200 text-xs lg:text-sm font-light mt-0.5">{item.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 lg:mt-12 pt-4 lg:pt-6 border-t border-violet-600/50">
                                <p className="text-violet-300 text-xs lg:text-sm font-light">
                                    Join 50,000+ developers accelerating their careers with a single hour a day.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;