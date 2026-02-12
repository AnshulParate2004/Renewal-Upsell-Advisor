import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight } from "lucide-react";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle sign in logic here
        console.log("Sign in:", { email, password });

        // Navigate to dashboard after sign-in
        navigate("/app");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="h-12 w-12 flex items-center justify-center bg-indigo-600 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-2xl font-black text-black dark:text-white tracking-tight uppercase leading-tight">
                                Revenue
                            </span>
                            <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase leading-tight">
                                Navigator
                            </span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Welcome Back</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Sign in to your account</p>
                </div>

                {/* Sign In Form */}
                <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-sm font-medium text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-sm font-medium text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 border-2 border-black accent-indigo-600"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remember me</span>
                            </label>
                            <button type="button" className="text-sm font-bold text-indigo-600 hover:underline">
                                Forgot password?
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center justify-center gap-2"
                        >
                            Sign In <ArrowRight className="h-5 w-5" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-black dark:border-white"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 font-black">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Sign In */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black dark:border-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            Google
                        </button>
                        <button className="px-4 py-2 bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black dark:border-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            Microsoft
                        </button>
                    </div>
                </div>

                {/* Sign Up Link */}
                <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/signup" className="font-bold text-indigo-600 hover:underline">
                        Sign up for free
                    </Link>
                </p>

                {/* Back to Home */}
                <div className="text-center mt-4">
                    <Link to="/" className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
