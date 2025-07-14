import {useState, useCallback, useRef, useEffect} from "react";

const useAIChat = (apiBaseURL = "http://localhost:8000/api") => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            content:
                "مرحباً! أنا مساعد الموارد البشرية الذكي. كيف يمكنني مساعدتك اليوم؟",
            timestamp: new Date().toISOString(),
            type: "general",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState("idle"); // idle, connecting, connected, error
    const [rateLimitInfo, setRateLimitInfo] = useState(null);

    const abortControllerRef = useRef(null);

    // التحقق من حالة الاتصال
    const checkConnection = useCallback(async () => {
        setConnectionStatus("connecting");
        try {
            const token = localStorage.getItem("token"); // تم تغيير اسم التوكن
            if (!token) {
                throw new Error("Token not found");
            }

            const response = await fetch(
                `${apiBaseURL}/ai-chat/test-connection`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (response.ok) {
                setConnectionStatus("connected");
                return true;
            } else {
                throw new Error("Connection failed");
            }
        } catch (err) {
            setConnectionStatus("error");
            setError("فشل في الاتصال بالخادم");
            return false;
        }
    }, [apiBaseURL]);

    // إرسال رسالة
    const sendMessage = useCallback(
        async (messageText) => {
            if (!messageText.trim() || isLoading) return null;

            // إلغاء أي طلب سابق
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);

            // إضافة رسالة المستخدم
            const userMessage = {
                id: Date.now(),
                role: "user",
                content: messageText,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMessage]);

            try {
                const token = localStorage.getItem("token"); // تم تغيير اسم التوكن

                if (!token) {
                    throw new Error("يرجى تسجيل الدخول أولاً");
                }

                // تحضير تاريخ المحادثة (آخر 20 رسالة)
                const conversationHistory = messages.slice(-20).map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const response = await fetch(`${apiBaseURL}/ai-chat/message`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        message: messageText,
                        conversation_history: conversationHistory,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                const data = await response.json();

                // تحديث معلومات Rate Limit
                if (data.rate_limit) {
                    setRateLimitInfo(data.rate_limit);
                }

                if (response.ok && data.success) {
                    const aiMessage = {
                        id: Date.now() + 1,
                        role: "assistant",
                        content: data.response,
                        timestamp: data.timestamp || new Date().toISOString(),
                        type: data.metadata?.response_type || "general",
                        processingTime: data.processing_time_ms,
                        hasData: data.metadata?.has_data || false,
                    };

                    setMessages((prev) => [...prev, aiMessage]);
                    setConnectionStatus("connected");
                    return aiMessage;
                } else {
                    // التعامل مع أخطاء مختلفة
                    let errorMessage = "حدث خطأ في إرسال الرسالة";

                    if (response.status === 429) {
                        errorMessage =
                            "تم تجاوز الحد المسموح من الرسائل. يرجى الانتظار دقيقة والمحاولة مرة أخرى.";
                    } else if (response.status === 401) {
                        errorMessage =
                            "انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.";
                    } else if (response.status === 422) {
                        errorMessage = data.error || "بيانات غير صحيحة";
                    } else if (response.status >= 500) {
                        errorMessage = "خطأ في الخادم. يرجى المحاولة لاحقاً.";
                    } else {
                        errorMessage = data.error || "حدث خطأ غير متوقع";
                    }

                    throw new Error(errorMessage);
                }
            } catch (err) {
                if (err.name === "AbortError") {
                    return null; // تم إلغاء الطلب
                }

                setError(err.message);
                setConnectionStatus("error");

                const errorMessage = {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: `عذراً، ${err.message}`,
                    timestamp: new Date().toISOString(),
                    type: "error",
                    isError: true,
                };
                setMessages((prev) => [...prev, errorMessage]);
                return null;
            } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [apiBaseURL, messages, isLoading]
    );

    // جلب الاقتراحات
    const fetchSuggestions = useCallback(async () => {
        try {
            const token = localStorage.getItem("token"); // تم تغيير اسم التوكن
            if (!token) return null;

            const response = await fetch(`${apiBaseURL}/ai-chat/suggestions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.suggestions : null;
            }
            return null;
        } catch (err) {
            console.error("Error fetching suggestions:", err);
            return null;
        }
    }, [apiBaseURL]);

    // جلب الإحصائيات السريعة
    const fetchQuickStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("token"); // تم تغيير اسم التوكن
            if (!token) return null;

            const response = await fetch(`${apiBaseURL}/ai-chat/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.stats : null;
            }
            return null;
        } catch (err) {
            console.error("Error fetching stats:", err);
            return null;
        }
    }, [apiBaseURL]);

    // إعادة إرسال آخر رسالة
    const retryLastMessage = useCallback(() => {
        const lastUserMessage = [...messages]
            .reverse()
            .find((m) => m.role === "user");
        if (lastUserMessage) {
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);

    // مسح المحادثة
    const clearMessages = useCallback(() => {
        setMessages([
            {
                id: Date.now(),
                role: "assistant",
                content: "تم مسح المحادثة. كيف يمكنني مساعدتك اليوم؟",
                timestamp: new Date().toISOString(),
                type: "general",
            },
        ]);
        setError(null);
        setConnectionStatus("idle");
    }, []);

    // مسح الخطأ
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // إلغاء الطلب الحالي
    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    // تنظيف عند الـ unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // إحصائيات المحادثة
    const chatStats = {
        totalMessages: messages.length,
        userMessages: messages.filter((m) => m.role === "user").length,
        assistantMessages: messages.filter((m) => m.role === "assistant")
            .length,
        errorMessages: messages.filter((m) => m.isError).length,
        averageResponseTime: messages
            .filter((m) => m.processingTime)
            .reduce((acc, m, _, arr) => acc + m.processingTime / arr.length, 0),
    };

    return {
        // البيانات
        messages,
        isLoading,
        error,
        connectionStatus,
        rateLimitInfo,
        chatStats,

        // الوظائف
        sendMessage,
        fetchSuggestions,
        fetchQuickStats,
        retryLastMessage,
        clearMessages,
        clearError,
        cancelRequest,
        checkConnection,
    };
};

export default useAIChat;
