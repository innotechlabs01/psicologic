import React, { useCallback } from 'react';
import { useGlobalStore } from '../../store/global.store';
import { Menu, X } from 'lucide-react';

export const SidebarToggle: React.FC = () => {
    const { isSidebarOpen, toggleSidebar } = useGlobalStore();

    const handleToggle = useCallback(() => {
        toggleSidebar();
    }, [toggleSidebar]);

    return (
        <button
            onClick={handleToggle}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:hidden"
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isSidebarOpen}
        >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
    );
};
