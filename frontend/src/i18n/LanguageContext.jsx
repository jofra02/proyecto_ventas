import React, { createContext, useState, useContext, useEffect } from 'react';
import { en } from './locales/en';
import { es } from './locales/es';

const LanguageContext = createContext();

const dictionaries = { en, es };

export const LanguageProvider = ({ children }) => {
    // Default to 'en' or load from localStorage
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    const t = (key) => {
        const dict = dictionaries[language] || dictionaries['en'];
        return dict[key] || key; // Fallback to key if not found
    };

    const changeLanguage = (lang) => {
        if (dictionaries[lang]) {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
