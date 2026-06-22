import { create } from 'zustand';

interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/** Estado global del Command Palette (⌘K).
 *  Permite que cualquier componente (Sidebar, Topbar, FAB...) lo abra. */
export const useCommandPalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
