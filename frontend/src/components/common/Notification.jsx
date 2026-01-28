import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink } from 'lucide-react';

const Notification = ({ message, type, action, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 4700); // Start exit animation slightly before removal
        return () => clearTimeout(timer);
    }, []);

    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const styles = {
        success: "border-green-100 bg-green-50 text-green-800",
        error: "border-red-100 bg-red-50 text-red-800",
        warning: "border-amber-100 bg-amber-50 text-amber-800",
        info: "border-blue-100 bg-blue-50 text-blue-800"
    };

    const actionButtonStyles = {
        success: "text-green-700 hover:bg-green-100",
        error: "text-red-700 hover:bg-red-100",
        warning: "text-amber-700 hover:bg-amber-100",
        info: "text-blue-700 hover:bg-blue-100"
    };

    const handleActionClick = (e) => {
        e.stopPropagation();
        if (action?.onClick) {
            action.onClick();
        }
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`
            pointer-events-auto flex gap-3 p-4 rounded-xl border shadow-lg w-[320px] md:w-[400px]
            transition-all duration-300 transform
            ${isExiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-slide-in'}
            ${styles[type] || styles.info}
        `}>
            <div className="flex-shrink-0 pt-0.5">
                {icons[type] || icons.info}
            </div>
            <div className="flex-grow flex flex-col gap-2 min-w-0">
                <div className="text-sm font-medium break-words leading-relaxed">
                    {message}
                </div>
                {action && (
                    <button
                        onClick={handleActionClick}
                        className={`
                            self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider
                            transition-colors duration-200
                            ${actionButtonStyles[type] || actionButtonStyles.info}
                        `}
                    >
                        {action.label}
                        <ExternalLink size={12} />
                    </button>
                )}
            </div>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(onClose, 300);
                }}
                className="flex-shrink-0 self-start hover:bg-black/5 p-1 rounded-full transition-colors"
            >
                <X size={16} className="opacity-50 hover:opacity-100" />
            </button>
        </div>
    );
};

export default Notification;
