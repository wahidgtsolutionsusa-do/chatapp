// src/components/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaSignOutAlt, FaPlus, FaSun, FaMoon, FaTrash } from "react-icons/fa";

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text && !image) return;

    let imageUrl = "";

    try {
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", "chat_images");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dxcqsbbco/image/upload",
          { method: "POST", body: formData }
        );

        const data = await res.json();
        imageUrl = data.secure_url;
      }

      await addDoc(collection(db, "messages"), {
        text,
        image: imageUrl,
        uid: user.uid,
        email: user.email,
        timestamp: serverTimestamp(),
      });

      setText("");
      setImage(null);
    } catch (err) {
      console.error("Send Error:", err);
    }
  };

  const toggleSelectMsg = (id) => {
    setSelectedMsgs((prev) =>
      prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedMsgs.length === 0) return;
    try {
      for (let id of selectedMsgs) {
        const msg = messages.find((m) => m.id === id);
        if (!msg || msg.uid !== user.uid) continue;
        await deleteDoc(doc(db, "messages", id));
      }
      setSelectedMsgs([]);
      setShowDeletePopup(false);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className={`flex flex-col h-screen w-screen ${darkMode ? "bg-gray-900 text-white" : "bg-[#fff0f8] text-black"}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center p-3 shadow-md bg-white text-black">
        <h2 className="text-lg font-semibold truncate">Chat - {user.email}</h2>
        <div className="flex items-center gap-3">
          {selectedMsgs.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1 rounded-md text-white text-sm"
              style={{ backgroundColor: "#ff4d4f" }}
            >
              <FaTrash /> Delete ({selectedMsgs.length})
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full text-white"
            style={{ backgroundColor: darkMode ? "#fbbf24" : "#4b5563" }}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1 rounded-md text-white text-sm"
            style={{ backgroundColor: "#e77bd1" }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              onClick={() => toggleSelectMsg(msg.id)}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col max-w-full p-3 rounded-2xl shadow-sm break-words cursor-pointer ${
                msg.uid === user.uid
                  ? darkMode
                    ? "bg-gray-700 self-end text-white"
                    : "bg-white self-end text-black"
                  : darkMode
                  ? "bg-gray-600 self-start text-white"
                  : "bg-gray-200 self-start text-black"
              } ${selectedMsgs.includes(msg.id) ? "ring-2 ring-red-400" : ""}`}
            >
              <p className="text-xs opacity-70">{msg.email}</p>
              {msg.text && <p className="mt-1 text-sm">{msg.text}</p>}
              {msg.image && (
                <motion.img
                  src={msg.image}
                  alt="msg"
                  className="mt-2 rounded-xl max-w-[250px] border border-gray-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`flex items-center gap-2 p-3 border-t w-full ${darkMode ? "bg-gray-800 border-gray-700" : "bg-[#ffe6f0] border-gray-300"}`}
      >
        <label
          className={`cursor-pointer flex items-center justify-center p-3 rounded-full text-white`}
          style={{ backgroundColor: darkMode ? "#4b5563" : "#e77bd1" }}
        >
          <FaPlus />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden"
          />
        </label>

        <input
          type="text"
          placeholder="Type a message..."
          className={`flex-1 p-3 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 transition duration-200 ${
            darkMode ? "bg-gray-700 text-white focus:ring-blue-500" : "bg-white text-black focus:ring-[#e77bd1]"
          }`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-white transition duration-200 shadow"
          style={{ backgroundColor: darkMode ? "#4b5563" : "#e77bd1" }}
        >
          <FaPaperPlane />
        </motion.button>
      </form>
    </div>
  );
}
