import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import userReducer from "../features/user/userSlice";
import promptReducer from '../features/PromptForAi/PromptAiSlice';
import themeReducer from '../features/Darkmode/themeSlice'; 
import sidebarReducer from '../features/Sidebar/sidebarSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    user: userReducer,
    promptTextAi: promptReducer,
    theme: themeReducer,
    sidebar: sidebarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;