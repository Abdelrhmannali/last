import React, {useState, useRef, useEffect} from "react";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    RefreshCw,
    Minimize2,
} from "lucide-react";
import ChatSuggestions from "./ChatSuggestions";
import useAIChat from "../../hooks/useAIChat";
import {CHAT_CONFIG, formatTime} from "../../config/chatConfig";
import "./FloatingChatBot.css";

const FloatingChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputMessage, setInputMessage] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);

    // استخدام الـ hook المخصص
    const {
        messages,
        isLoading,
        error,
        sendMessage: sendChatMessage,
        fetchSuggestions,
        clearMessages,
        clearError,
    } = useAIChat();

    // تحديد الأيقونة بناءً على الدور
    const getMessageIcon = (role) => {
        return role === "user" ? <User size={16} /> : <Bot size={16} />;
    };

    // تمرير الرسائل للأسفل
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // تركيز على الإدخال عند الفتح
    useEffect(() => {
        if (isOpen && !isMinimized) {
            chatInputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    // إرسال رسالة
    const sendMessage = async (messageText = inputMessage) => {
        if (!messageText.trim() || isLoading) return;

        setShowSuggestions(false);
        setInputMessage("");

        await sendChatMessage(messageText);
    };

    // التعامل مع الضغط على Enter
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // تشغيل الاقتراحات
    const toggleSuggestions = () => {
        setShowSuggestions(!showSuggestions);
    };

    // معالجة إغلاق الخطأ
    const handleCloseError = () => {
        clearError();
    };

    return (
        <div className="floating-chatbot">
            {/* الأيقونة العائمة */}
            {!isOpen && (
                <div
                    className="chatbot-trigger"
                    onClick={() => setIsOpen(true)}>
                    <MessageCircle size={24} />
                    <span className="chatbot-badge">AI</span>
                </div>
            )}

            {/* نافذة الدردشة */}
            {isOpen && (
                <div
                    className={`chatbot-window ${
                        isMinimized ? "minimized" : ""
                    }`}>
                    {/* رأس النافذة */}
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <Bot size={20} />
                            <span>مساعد الموارد البشرية</span>
                        </div>
                        <div className="chatbot-controls">
                            <button
                                className="control-btn"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "تكبير" : "تصغير"}>
                                <Minimize2 size={16} />
                            </button>
                            <button
                                className="control-btn"
                                onClick={clearMessages}
                                title="مسح المحادثة">
                                <RefreshCw size={16} />
                            </button>
                            <button
                                className="control-btn close-btn"
                                onClick={() => setIsOpen(false)}
                                title="إغلاق">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* محتوى الدردشة */}
                    {!isMinimized && (
                        <>
                            {/* منطقة الرسائل */}
                            <div className="chatbot-messages">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message ${message.role} ${
                                            message.isError ? "error" : ""
                                        }`}>
                                        <div className="message-icon">
                                            {getMessageIcon(message.role)}
                                        </div>
                                        <div className="message-content">
                                            <div
                                                className="message-text"
                                                dangerouslySetInnerHTML={{
                                                    __html: message.content.replace(
                                                        /\n/g,
                                                        "<br>"
                                                    ),
                                                }}
                                            />
                                            <div className="message-meta">
                                                <span className="message-time">
                                                    {formatTime(
                                                        message.timestamp
                                                    )}
                                                </span>
                                                {message.processingTime && (
                                                    <span className="processing-time">
                                                        {(
                                                            message.processingTime /
                                                            1000
                                                        ).toFixed(1)}
                                                        s
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* مؤشر الكتابة */}
                                {isLoading && (
                                    <div className="message assistant">
                                        <div className="message-icon">
                                            <Bot size={16} />
                                        </div>
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <Loader2
                                                    size={16}
                                                    className="spinning"
                                                />
                                                <span>جاري كتابة الرد...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* الاقتراحات */}
                            {showSuggestions && (
                                <ChatSuggestions
                                    onSuggestionClick={sendMessage}
                                    onClose={() => setShowSuggestions(false)}
                                    fetchSuggestions={fetchSuggestions}
                                />
                            )}

                            {/* رسالة الخطأ */}
                            {error && (
                                <div className="error-message">
                                    <span>{error}</span>
                                    <button onClick={handleCloseError}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* منطقة الإدخال */}
                            <div className="chatbot-input">
                                <div className="input-container">
                                    <textarea
                                        ref={chatInputRef}
                                        value={inputMessage}
                                        onChange={(e) =>
                                            setInputMessage(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        placeholder="اكتب رسالتك هنا..."
                                        disabled={isLoading}
                                        rows={1}
                                        style={{resize: "none"}}
                                    />
                                    <div className="input-actions">
                                        <button
                                            className="suggestions-btn"
                                            onClick={toggleSuggestions}
                                            title="اقتراحات الأسئلة">
                                            💡
                                        </button>
                                        <button
                                            className="send-btn"
                                            onClick={() => sendMessage()}
                                            disabled={
                                                isLoading ||
                                                !inputMessage.trim()
                                            }>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FloatingChatBot;
