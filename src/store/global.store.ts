import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
    isSidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    isGlobalLoading: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setGlobalLoading: (isLoading: boolean) => void;
}

export const useGlobalStore = create<GlobalState>()(
    persist(
        (set) => ({
            isSidebarOpen: false,
            theme: 'system',
            isGlobalLoading: false,

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
            setTheme: (theme) => set({ theme }),
            setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
        }),
        {
            name: 'global-storage',
        }
    )
);
