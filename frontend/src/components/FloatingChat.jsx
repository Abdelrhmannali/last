import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import GeminiChat from "../pages/GeminiChat/GeminiChat";
import "./FloatingChat.css";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="floating-chat-button" onClick={() => setIsOpen(!isOpen)}>
        <FaCommentDots size={24} />
      </div>

      {isOpen && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <span>🤖 HR Chat</span>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <GeminiChat />
        </div>
      )}
    </>
  );
}
