import React, { useState, useEffect } from 'react';
import { Lightbulb, X, RefreshCw } from 'lucide-react';

const ChatSuggestions = ({ onSuggestionClick, onClose, fetchSuggestions }) => {
  const [suggestions, setSuggestions] = useState({
    quick_questions: [],
    advanced_queries: [],
    reports: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('quick_questions');

  const tabs = [
    { id: 'quick_questions', label: 'أسئلة سريعة', icon: '⚡' },
    { id: 'advanced_queries', label: 'استعلامات متقدمة', icon: '🔍' },
    { id: 'reports', label: 'تقارير', icon: '📊' }
  ];

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchSuggestions();
      if (data) {
        setSuggestions(data);
      } else {
        setError('فشل في تحميل الاقتراحات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الاقتراحات');
      console.error('Error loading suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    onClose();
  };

  if (isLoading) {
    return (
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <div className="suggestions-title">
            <Lightbulb size={16} />
            <span>اقتراحات الأسئلة</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>
        <div className="suggestions-loading">
          <RefreshCw size={20} className="spinning" />
          <span>جاري تحميل الاقتراحات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <div className="suggestions-title">
            <Lightbulb size={16} />
            <span>اقتراحات الأسئلة</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>
        <div className="suggestions-error">
          <span>{error}</span>
          <button onClick={loadSuggestions} className="retry-btn">
            <RefreshCw size={14} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const currentSuggestions = suggestions[activeTab] || [];

  return (
    <div className="suggestions-panel">
      <div className="suggestions-header">
        <div className="suggestions-title">
          <Lightbulb size={16} />
          <span>اقتراحات الأسئلة</span>
        </div>
        <div className="suggestions-actions">
          <button onClick={loadSuggestions} className="refresh-btn" title="تحديث">
            <RefreshCw size={14} />
          </button>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="suggestions-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="suggestions-content">
        {currentSuggestions.length > 0 ? (
          <div className="suggestions-list">
            {currentSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-text">{suggestion}</span>
                <span className="suggestion-arrow">←</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="suggestions-empty">
            <span>لا توجد اقتراحات متاحة حالياً</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSuggestions;