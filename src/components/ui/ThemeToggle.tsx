import React, { useCallback } from 'react';
import { useGlobalStore } from '../../store/global.store';
import { Moon, Sun, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useGlobalStore();

    const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        window.dispatchEvent(new Event('global-storage-change'));
    }, [setTheme]);

    const themes = [
        { name: 'light', icon: Sun, label: 'Modo claro' },
        { name: 'dark', icon: Moon, label: 'Modo oscuro' },
        { name: 'system', icon: Monitor, label: 'Sistema' },
    ] as const;

    return (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border" role="group" aria-label="Cambiar tema">
            {themes.map(({ name, icon: Icon, label }) => (
                <button
                    key={name}
                    onClick={() => handleThemeChange(name)}
                    className={`p-1.5 rounded-md transition-all ${theme === name
                        ? 'bg-card shadow-sm text-primary scale-105 border border-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    title={label}
                    aria-label={label}
                    aria-pressed={theme === name}
                >
                    <Icon size={16} />
                </button>
            ))}
        </div>
    );
};
