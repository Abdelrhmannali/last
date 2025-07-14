// إعدادات الشات
export const CHAT_CONFIG = {
    // الـ API
    API_BASE_URL: "http://localhost:8000/api",

    // حدود النظام
    MESSAGE_MIN_LENGTH: 2,
    MESSAGE_MAX_LENGTH: 500,
    MAX_CONVERSATION_HISTORY: 20,

    // الوقت
    RETRY_DELAY: 1000, // مللي ثانية
    CONNECTION_TIMEOUT: 15000, // مللي ثانية

    // الرسائل الافتراضية
    DEFAULT_MESSAGES: {
        WELCOME:
            "مرحباً! أنا مساعد الموارد البشرية الذكي. كيف يمكنني مساعدتك اليوم؟",
        ERROR_GENERIC: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
        ERROR_CONNECTION: "فشل في الاتصال بالخادم. تحقق من الاتصال بالإنترنت.",
        ERROR_AUTH: "انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.",
        ERROR_RATE_LIMIT:
            "تم تجاوز الحد المسموح من الرسائل. يرجى الانتظار قليلاً.",
        TYPING: "جاري كتابة الرد...",
        CLEARED: "تم مسح المحادثة. كيف يمكنني مساعدتك؟",
    },

    // إعدادات الواجهة
    UI: {
        ANIMATION_DURATION: 300,
        AUTO_SCROLL_BEHAVIOR: "smooth",
        SUGGESTIONS_LIMIT: 5,
        MESSAGES_LIMIT: 100, // حد أقصى للرسائل المحفوظة
    },

    // أنواع الاستجابات
    RESPONSE_TYPES: {
        DATA_RESULTS: "data_results",
        SINGLE_RESULT: "single_result",
        ANALYSIS: "analysis",
        GENERAL: "general",
        ERROR: "error",
    },

    // حالات الاتصال
    CONNECTION_STATUS: {
        IDLE: "idle",
        CONNECTING: "connecting",
        CONNECTED: "connected",
        ERROR: "error",
    },
};

// وظائف مساعدة للتحقق من صحة البيانات
export const validateMessage = (message) => {
    if (!message || typeof message !== "string") {
        return {isValid: false, error: "الرسالة مطلوبة"};
    }

    const trimmed = message.trim();

    if (trimmed.length < CHAT_CONFIG.MESSAGE_MIN_LENGTH) {
        return {
            isValid: false,
            error: `الرسالة قصيرة جداً (الحد الأدنى ${CHAT_CONFIG.MESSAGE_MIN_LENGTH} حروف)`,
        };
    }

    if (trimmed.length > CHAT_CONFIG.MESSAGE_MAX_LENGTH) {
        return {
            isValid: false,
            error: `الرسالة طويلة جداً (الحد الأقصى ${CHAT_CONFIG.MESSAGE_MAX_LENGTH} حرف)`,
        };
    }

    return {isValid: true, message: trimmed};
};

// تنسيق الوقت
export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// تنسيق التاريخ
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "اليوم";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "أمس";
    } else {
        return date.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
};

// معالجة أخطاء HTTP
export const handleHttpError = (status, data) => {
    switch (status) {
        case 400:
            return data.error || "طلب غير صحيح";
        case 401:
            return CHAT_CONFIG.DEFAULT_MESSAGES.ERROR_AUTH;
        case 403:
            return "ليس لديك صلاحية للوصول لهذه الخدمة";
        case 404:
            return "الخدمة غير متوفرة حالياً";
        case 422:
            return data.error || "بيانات غير صحيحة";
        case 429:
            return CHAT_CONFIG.DEFAULT_MESSAGES.ERROR_RATE_LIMIT;
        case 500:
        case 502:
        case 503:
        case 504:
            return "خطأ في الخادم. يرجى المحاولة لاحقاً";
        default:
            return CHAT_CONFIG.DEFAULT_MESSAGES.ERROR_GENERIC;
    }
};

// حفظ واستعادة تاريخ المحادثة (اختياري)
export const saveConversationToStorage = (messages) => {
    try {
        const conversationData = {
            messages: messages.slice(-CHAT_CONFIG.UI.MESSAGES_LIMIT),
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(
            "hr_chat_history",
            JSON.stringify(conversationData)
        );
    } catch (error) {
        console.warn("Failed to save conversation history:", error);
    }
};

export const loadConversationFromStorage = () => {
    try {
        const stored = localStorage.getItem("hr_chat_history");
        if (stored) {
            const data = JSON.parse(stored);
            // التحقق من أن البيانات ليست قديمة (أكثر من يوم)
            const storedDate = new Date(data.timestamp);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            if (storedDate > oneDayAgo && Array.isArray(data.messages)) {
                return data.messages;
            }
        }
    } catch (error) {
        console.warn("Failed to load conversation history:", error);
    }

    // إرجاع الرسالة الافتراضية
    return [
        {
            id: 1,
            role: "assistant",
            content: CHAT_CONFIG.DEFAULT_MESSAGES.WELCOME,
            timestamp: new Date().toISOString(),
            type: "general",
        },
    ];
};

export default CHAT_CONFIG;
