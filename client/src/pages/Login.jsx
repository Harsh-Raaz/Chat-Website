import { useState } from "react";
import { MessageCircle, User, Mail, Lock, EyeClosed, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";


const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState("")

    const navigate = useNavigate();
    const { login, loading, error } = useAuthStore();

    const validateForm = () => {
        if (!email.trim() || !password.trim()) {
            return "Please fill all fields";
        }

        const emailRegex = /^\S+@\S+\.\S+$/;

        if (!emailRegex.test(email)) {
            return "Please enter a valid email";
        }

        if (password.length < 6) {
            return "Password must be at least 6 characters";
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setFormError("");

        const success = await login({ email, password });

        if (success) {
            navigate("/chat");
        }
    };

    return (
        <div className="min-h-screen w-full bg-linear-to-br from-indigo-100 via-purple-200 to-pink-200 flex items-center justify-center">

            {/* Center Div */}
            <div className="flex items-center justify-center flex-col gap-6 max-w-md w-full px-4">

                {/* Upper Div */}
                <div className="flex flex-col gap-2 items-center">
                    <div className="bg-linear-to-br from-purple-600 to-pink-500 rounded-3xl px-6 py-6 w-min mb-2">
                        <MessageCircle className="text-white" />
                    </div>
                    <h1 className="text-3xl font-poppins font-bold text-black">
                        Login
                    </h1>
                    <p className="font-poppins text-gray-600 text-center">
                        Welcome back, let’s chat
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-xl p-8 gap-8 w-full min-h-105"

                >

                    {/* User details */}
                    <div className="flex flex-col w-full gap-2">

                        <label className="text-sm font-poppins font-medium text-gray-700">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFormError("");
                                }}
                                type="email"
                                placeholder="Enter your email"
                                className="w-full rounded-lg border border-gray-300 pl-10 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <Mail className="absolute top-2.5 left-2.5 h-6 w-6 text-gray-500" />
                        </div>

                        <label className="text-sm font-poppins font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setFormError("")
                                }
                                }
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full rounded-lg border border-gray-300 pl-10 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                            />

                            {showPassword ? (
                                <Eye
                                    onClick={() => setShowPassword(false)}
                                    className="absolute top-4 right-4 cursor-pointer text-gray-400 h-4 w-4"
                                />
                            ) : (
                                <EyeClosed
                                    onClick={() => setShowPassword(true)}
                                    className="absolute top-4 right-4 cursor-pointer text-gray-400 h-4 w-4"
                                />
                            )}

                            <Lock className="absolute top-2.5 left-2.5 h-6 w-6 text-gray-500" />
                        </div>
                    </div>

                    {formError && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <svg
                                    className="h-3 w-3 text-red-600"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 1L6 7M6 9.5L6 10.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm leading-relaxed text-red-700 font-medium">{formError}</p>
                        </div>
                    )}

                    {!formError && error && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <svg
                                    className="h-3 w-3 text-red-600"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 1L6 7M6 9.5L6 10.5"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm leading-relaxed text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-4 w-full bg-linear-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-2xl font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading && (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        )}
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {/* Footer */}
                    <p className="text-sm text-gray-600">
                        Don’t have an account?{" "}
                        <span
                            onClick={() => navigate("/")}
                            className="text-purple-600 font-semibold cursor-pointer"
                        >
                            Create Account
                        </span>
                    </p>

                </form>
            </div>
        </div>
    );
};

export default Login;
