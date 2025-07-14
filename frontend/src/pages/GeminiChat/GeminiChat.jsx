import React, { useState } from "react";
import api from "../../api";
import "./GeminiChat.css"; 

export default function GeminiWithCV() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingCV, setLoadingCV] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingChat(true);

    try {
      const response = await api.post("/chat", { message: input });
      const botReply = { sender: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error("Gemini error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ حصل خطأ في الاتصال بـ Gemini أو التوكن غير صالح." },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("cv", file);
    setLoadingCV(true);
    setResult(null);

    try {
      const response = await api.post("/upload-cv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      console.error("CV Upload error:", error);
      alert("❌ Error uploading CV");
    } finally {
      setLoadingCV(false);
    }
  };

  return (
    <div className="chat-container">
      <h3>🤖 HR Gemini Assistant</h3>

      {/* Chat Section */}
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}
        {loadingChat && (
          <div className="chat-message bot">
            <span>⏳ بيكتب...</span>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="اكتب سؤالك..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={sendMessage}>إرسال</button>
      </div>

      <hr style={{ margin: "2rem 0", borderColor: "#ccc" }} />

      {/* CV Upload Section */}
 
   

    </div>
  );
}
