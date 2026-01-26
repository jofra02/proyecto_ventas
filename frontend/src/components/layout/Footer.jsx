import React, { useState, useEffect } from 'react';

const Footer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <footer className="bg-white border-t border-border py-4 px-8 flex justify-between items-center text-xs text-secondary mt-auto">
            <div>
                <span className="font-semibold">{import.meta.env.VITE_APP_NAME}</span> &copy; {new Date().getFullYear()} - v1.0.0
            </div>

            <div className="flex items-center gap-6">
                <div>
                    {currentTime.toLocaleTimeString()} | {currentTime.toLocaleDateString()}
                </div>
                <a href="#" className="hover:text-primary transition-colors">Support</a>
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            </div>
        </footer>
    );
};

export default Footer;
