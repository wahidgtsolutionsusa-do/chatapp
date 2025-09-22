// src/components/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, storage, auth } from "../firebase";
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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaSignOutAlt,
  FaPlus,
  FaSun,
  FaMoon,
  FaTrash,
} from "react-icons/fa";

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  // 🔹 Fetch messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Send message (text + image)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text && !image) return;

    let imageUrl = "";
    let imageRefPath = "";

    try {
      if (image) {
        imageRefPath = `images/${Date.now()}_${image.name}`;
        const storageRef = ref(storage, imageRefPath);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "messages"), {
        text,
        image: imageUrl,
        imageRefPath,
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

  // 🔹 Select / Unselect message
  const toggleSelectMsg = (id) => {
    setSelectedMsgs((prev) =>
      prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
    );
  };

  // 🔹 Delete selected messages
  const handleDelete = async () => {
    try {
      for (let id of selectedMsgs) {
        const msg = messages.find((m) => m.id === id);
        if (!msg || msg.uid !== user.uid) continue;

        await deleteDoc(doc(db, "messages", id));
        if (msg.imageRefPath) {
          const imageRef = ref(storage, msg.imageRefPath);
          await deleteObject(imageRef);
        }
      }
      setSelectedMsgs([]);
      setShowDeletePopup(false);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 🔹 Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center p-3 shadow-md ${
          darkMode ? "bg-gray-800" : "bg-gray-200"
        }`}
      >
        <h2 className="text-lg font-semibold truncate">Chat - {user.email}</h2>
        <div className="flex items-center gap-3">
          {selectedMsgs.length > 0 && (
            <button
              onClick={() => setShowDeletePopup(true)}
              className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-md hover:bg-red-600 transition duration-200 text-white text-sm"
            >
              <FaTrash /> Delete ({selectedMsgs.length})
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-md hover:bg-red-600 transition duration-200 text-white text-sm"
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
                    ? "bg-blue-700 self-end"
                    : "bg-gray-300 self-end"
                  : darkMode
                  ? "bg-gray-700 self-start"
                  : "bg-gray-100 self-start"
              } ${
                selectedMsgs.includes(msg.id) ? "ring-2 ring-red-400" : ""
              }`}
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

      {/* Delete Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div
            className={`p-4 rounded-lg shadow-lg w-[220px] ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >
            <p className="text-sm mb-3">
              Delete {selectedMsgs.length} message
              {selectedMsgs.length > 1 ? "s" : ""}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeletePopup(false)}
                className={`px-3 py-1 rounded-md text-sm ${
                  darkMode
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`flex items-center gap-2 p-3 border-t w-full ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"
        }`}
      >
        {/* File Upload */}
        <label
          className={`cursor-pointer flex items-center justify-center p-3 rounded-full ${
            darkMode ? "bg-blue-600" : "bg-black"
          } text-white`}
        >
          <FaPlus />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden"
          />
        </label>

        {/* Text Input */}
        <input
          type="text"
          placeholder="Type a message..."
          className={`flex-1 p-3 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 transition duration-200 ${
            darkMode
              ? "bg-gray-700 text-white focus:ring-blue-500"
              : "bg-white text-black focus:ring-gray-400"
          }`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Send Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-5 py-2 rounded-full transition duration-200 shadow ${
            darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"
          } text-white`}
        >
          <FaPaperPlane /> 
        </motion.button>
      </form>
    </div>
  );
}
