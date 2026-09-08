import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  isOpen: boolean;
}

const initialState: SidebarState = {
  isOpen: true,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sidebarOpen", String(state.isOpen));
        } catch {
          // ignore
        }
      }
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sidebarOpen", String(state.isOpen));
        } catch {
          // ignore
        }
      }
    },
    initSidebar: (state) => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("sidebarOpen");
          if (saved !== null) {
            state.isOpen = saved === "true";
          }
        } catch {
          // ignore
        }
      }
    },
  },
});

export const { toggleSidebar, setSidebarOpen, initSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
