import React, { useEffect, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export const ThemeSync: React.FC = () => {
    const theme = useSyncExternalStore(
        emptySubscribe,
        () => {
            try {
                const stored = localStorage.getItem('global-storage');
                if (stored) {
                    const data = JSON.parse(stored);
                    const currentTheme = data.state?.theme;
                    if (currentTheme && currentTheme !== 'system') return currentTheme;
                }
            } catch (e) {}
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        },
        () => 'light'
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        const handleStorage = () => {
            try {
                const stored = localStorage.getItem('global-storage');
                if (stored) {
                    const data = JSON.parse(stored);
                    const currentTheme = data.state?.theme || 'system';
                    if (currentTheme === 'system') {
                        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                        root.classList.remove('light', 'dark');
                        root.classList.add(systemTheme);
                    } else {
                        root.classList.remove('light', 'dark');
                        root.classList.add(currentTheme);
                    }
                }
            } catch (e) {}
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('global-storage-change', handleStorage);
        
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('global-storage-change', handleStorage);
        };
    }, []);

    return null;
};
