// src/components/LoginForm.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { motion } from "framer-motion";

// ✅ Local image import
import bgImage from "../assets/bg-login.png";

export default function LoginForm({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err) {
      setError("Invalid credentials or user does not exist.");
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen w-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <motion.form
        onSubmit={handleLogin}
        className="flex flex-col w-full max-w-md p-8 rounded-2xl shadow-lg space-y-4"
        style={{
          background: "linear-gradient(180deg, #e77bd1, #000)", // ✅ Gradient top #e77bd1 to bottom black
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white text-center">Login</h2>

        {error && (
          <motion.p
            className="text-red-500 text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-full bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition duration-200"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-full bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition duration-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="bg-white text-white py-3 rounded-full hover:bg-gray-200 transition duration-200 shadow-md"
        >
          Login
        </motion.button>
      </motion.form>
    </div>
  );
}
