import { create } from 'zustand';

interface AdminStore {
  adminKey: string;
  setAdminKey: (key: string) => void;
  clearAdminKey: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  adminKey: '',
  setAdminKey: (key: string) => set({ adminKey: key }),
  clearAdminKey: () => set({ adminKey: '' }),
}));
