import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Tailwind CSS utility class for hover lift effect (reused from Signup.jsx)
const hoverLift = "transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl";

// --- Success Modal Component (Customized for Login) ---
const SuccessModal = ({ isOpen, message, userName, onRedirect }) => {
    const [countdown, setCountdown] = useState(3);

    React.useEffect(() => {
        if (isOpen) {
            setCountdown(3); 
            // Store the username in session storage before redirect
            if (userName) {
                sessionStorage.setItem("userName", userName);
            }

            const redirectTimer = setTimeout(onRedirect, 3000); 
            
            const interval = setInterval(() => {
                setCountdown(prev => (prev > 1 ? prev - 1 : 0));
            }, 1000);

            return () => {
                clearTimeout(redirectTimer);
                clearInterval(interval);
                // Note: We intentionally don't remove "userName" here, 
                // as it's needed immediately on the Dashboard page after redirect.
            };
        }
    }, [isOpen, userName, onRedirect]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center border-t-4 border-violet-600 transform scale-100 transition-all duration-300">
                <div className="text-5xl mb-4">
                    <i className="fas fa-sign-in-alt text-violet-600"></i>
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                    Welcome Back, {userName || "User"}!
                </h3>
                <p className="text-gray-600 mb-6">{message}</p>
                
                <p className="text-base font-semibold text-violet-600">
                    Redirecting to Dashboard in {countdown} seconds...
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

// --- Responsive Back Button Component (Reused from Signup.jsx) ---
const BackButton = ({ className, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center text-violet-600 hover:text-indigo-800 transition-colors font-medium text-sm lg:text-base z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-gray-200 ${className}`}
    >
        <i className="fas fa-arrow-left mr-2"></i> Back to Home
    </button>
);


// --- Main Login Component ---
const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    
    // For network/server-side errors
    const [message, setMessage] = useState(""); 
    const [isLoading, setIsLoading] = useState(false);
    // Password eye toggle state
    const [showPassword, setShowPassword] = useState(false); 
    const [errors, setErrors] = useState({});
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [loggedInUserName, setLoggedInUserName] = useState(""); // State to store username for modal

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
        
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Email address is invalid.";
        }

        // Password Validation (Simple check for login)
        if (!formData.password) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Redirect logic uses navigate to push to the /Dashboard path
    const handleRedirectToDashboard = useCallback(() => {
        setIsModalOpen(false);
        navigate("/Dashboard"); // Updated to use /Dashboard
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setModalMessage(""); 
        setErrors({});

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // NOTE: This assumes your server responds with { user: { name: "..." } } on success
            const res = await axios.post("http://localhost:5050/login", {
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
            });

            const userData = res.data.user; 
            const name = userData?.name || "SkillSprint User";

            // Set the state for the modal
            setLoggedInUserName(name); 
            const successMessage = res.data.message || "You've successfully logged in!";
            setModalMessage(successMessage);
            setIsModalOpen(true);
            setFormData({ email: "", password: "" }); // Clear form

        } catch (err) {
            console.error("Login error:", err);
            // This message is for network/server errors only
            setMessage(err.response?.data?.error || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Informative Content - Changed slightly to be relevant to 'Login'
    const informativeContent = [
        { icon: "fa-tachometer-alt", text: "Personalized Dashboard", detail: "Track your progress, view your streaks, and plan your next sprint." },
        { icon: "fa-certificate", text: "Access Your Certificates", detail: "Download proof of mastery for all completed learning paths." },
        { icon: "fa-comments", text: "Community Access", detail: "Connect with other developers and collaborate on complex problems." },
    ];


    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            
            <SuccessModal 
                isOpen={isModalOpen} 
                message={modalMessage} 
                userName={loggedInUserName} // Pass the name to the modal
                onRedirect={handleRedirectToDashboard} 
            />

            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-['Poppins']">
                <div className="max-w-8xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
                    
                    {/* --- Back Button for Large Screens (Top Right) --- */}
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
                                        Log In to SkillSprint
                                    </h2>
                                    <p className="text-gray-600 text-base lg:text-lg font-light">
                                        Continue your learning journey and check your streak!
                                    </p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter your password"
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
                                    
                                    {/* Forgot Password Link */}
                                    <div className="flex justify-end">
                                        <button 
                                            type="button"
                                            className="text-sm font-medium text-violet-600 hover:text-indigo-800 transition-colors"
                                            onClick={() => navigate("/forgot-password")} 
                                        >
                                            Forgot Password?
                                        </button>
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
                                                Logging In...
                                            </span>
                                        ) : (
                                            <span>Log In <i className="fas fa-sign-in-alt ml-2"></i></span>
                                        )}
                                    </button>
                                </form>

                                {/* Error Message Display (General) - Only for network/server errors now */}
                                {message && !isModalOpen && (
                                    <div className="mt-6 p-4 rounded-xl text-center font-medium border bg-red-100 text-red-700 border-red-300">
                                        {message}
                                    </div>
                                )}

                                {/* Signup Link */}
                                <div className="mt-6 text-center text-gray-600 text-sm lg:text-base">
                                    Don't have an account?{" "}
                                    <button
                                        onClick={() => navigate("/signup")}
                                        className="text-violet-600 font-semibold hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                                
                                {/* --- Back Button for Mobile/Tablet (Below Signup Link) --- */}
                                <div className="mt-6 text-center lg:hidden">
                                    <BackButton
                                        onClick={() => navigate("/")}
                                        className="inline-flex w-auto"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Left Side - Informative Content (Reused from Signup.jsx) */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-violet-700 to-indigo-900 text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1">
                            <div className="mb-6 lg:mb-10">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 lg:mb-4 leading-tight">
                                    Ready to <span className="text-yellow-400">Jump Back</span> In?
                                </h1>
                                <p className="text-violet-200 text-base lg:text-lg font-light">
                                    Log in to pick up exactly where you left off and maintain your learning streak.
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
                                    The next skill is waiting for you. Let's start the clock!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;