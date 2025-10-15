import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Notification from "../components/Notification";
import Button from "../components/Button";
import { login, signup } from "../api/authapi";
import React from "react";
import { signin } from "../api/authapir";

export default function SignIn() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"normal" | "doctor" | "pharmacy">("normal");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await login({ username, password });
      if (res.success || res.token) {
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("token", res.token);
        setSuccess("✅ Logged in successfully!");
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setError(res.message || "❌ Login failed");
      }
    } catch (err: any) {
      setError(err.message || "❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
  
    try {
      // Pass form data to /signup-form
      navigate("/Signup-form", {
        state: { username, email, password, role },
      });
    } catch (err: any) {
      setError(err.message || "❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center  px-8 lg:px-24" 
      style={{ backgroundImage: "url('/images/2.png')" }} // 👈 background image
    >


      <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-5xl xl:max-w-6xl 
                      bg-white/30 backdrop-blur-lg p-10 lg:p-16 rounded-3xl shadow-2xl 
                      flex flex-col lg:flex-row gap-8">
        
        {/* Left Side */}
        <div className="hidden lg:flex flex-1 flex-col justify-center items-center 
                        bg-white/30 backdrop-blur-lg rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {isSignIn ? (
              <motion.div
                key="signin-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <h2 className="text-4xl font-bold mb-4 text-blue-700">Welcome Back!</h2>
                <p className="text-gray-700">Sign in to access your dashboard.</p>
              </motion.div>
            ) : (
              <motion.div
                key="signup-left"
                className="text-center"
              >
                <h2 className="text-4xl font-bold mb-4 text-blue-500">New Here?</h2>
                <p className="text-gray-700">Create a new account and start your journey with us.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Form */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? "signin-form" : "signup-form"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-center lg:text-left mb-6">
                {isSignIn ? "Sign In" : "Sign Up"}
              </h2>

              {error && <Notification message={error} type="error" />}
              {success && <Notification message={success} type="success" />}

              <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
                
                {isSignIn && (
                  <>

                  <input 
                  type="text" 
                  placeholder="Username" 
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60 backdrop-blur-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
                    
                    <input 
                  type="password" 
                  placeholder="Password" 
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60 backdrop-blur-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                  </>
                )}
                
                <Button type="submit" disabled={loading}>
                  {loading ? "Please wait..." : isSignIn ? "Sign In" : "Sign Up 𓂃🖊"}
                </Button>
              </form>

              <p className="mt-6 text-center text-gray-700 lg:text-left">
                {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
                <button 
                  className="text-blue-600 font-semibold hover:underline"
                  onClick={() => {
                    setIsSignIn(!isSignIn);
                    try {
                      // Pass form data to /signup-form
                    navigate("/Signup-form", {
                      state: { username, email, password, role },
                    });
                    } catch (err: any) {
                      setError(err.message || "❌ Something went wrong");
                    } finally {
                      setLoading(false);
                    }
                    setError(""); setSuccess("");
                  }}
                >
                  {isSignIn ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
