// src/App.jsx
import React, { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import Chat from "./components/Chat";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-white">Loading...</p>;

  return <div>{user ? <Chat user={user} /> : <LoginForm />}</div>;
}
