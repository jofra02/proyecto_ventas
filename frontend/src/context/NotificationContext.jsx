import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Notification from '../components/common/Notification';
import { useLanguage } from '../i18n/LanguageContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const { t } = useLanguage();
    const timersRef = useRef({});

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const showNotification = useCallback((message, options = {}) => {
        let finalMessage = message;
        let type = typeof options === 'string' ? options : (options.type || 'info');
        let action = options.action || null;
        let duration = options.duration || 5000;

        // 1. Handle Error objects or Axios/API responses
        if (message instanceof Error) {
            finalMessage = message.message;
            type = 'error';
        } else if (message && typeof message === 'object' && (message.response || message.request)) {
            const data = message.response?.data;
            const detail = data?.detail;
            if (typeof detail === 'string') {
                finalMessage = detail;
            } else if (Array.isArray(detail)) {
                finalMessage = detail.map(err => err.msg || JSON.stringify(err)).join(", ");
            } else {
                finalMessage = data?.message || "An unexpected error occurred";
            }
            type = 'error';
        }

        // 2. Auto-translate
        finalMessage = t(finalMessage);
        if (action?.label) {
            action.label = t(action.label);
        }

        // 3. Deduplication Check
        // We check if an identical notification (message + type) is already showing
        setNotifications((prev) => {
            const isDuplicate = prev.find(n => n.message === finalMessage && n.type === type);

            if (isDuplicate) {
                // If duplicate, we just reset its timer
                if (timersRef.current[isDuplicate.id]) {
                    clearTimeout(timersRef.current[isDuplicate.id]);
                }
                const timerId = setTimeout(() => {
                    removeNotification(isDuplicate.id);
                }, duration);
                timersRef.current[isDuplicate.id] = timerId;
                return prev;
            }

            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const timerId = setTimeout(() => {
                removeNotification(id);
            }, duration);
            timersRef.current[id] = timerId;

            return [...prev, { id, message: finalMessage, type, action, duration }];
        });
    }, [t, removeNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {notifications.map((n) => (
                    <Notification
                        key={n.id}
                        message={n.message}
                        type={n.type}
                        action={n.action}
                        onClose={() => removeNotification(n.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
