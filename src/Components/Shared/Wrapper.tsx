"use client";
import { setTheme } from "@/Redux/features/Darkmode/themeSlice";
import { initSidebar } from "@/Redux/features/Sidebar/sidebarSlice";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import Sidebar from "./Navbar/Sidebar";
import Topbar from "./Navbar/Topbar";
import { useEffect } from "react";
import { useSystemTheme } from "@/utils/Dark mode toggle/useSystemTheme";

export function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => state.sidebar?.isOpen ?? true);

  useEffect(() => {
    dispatch(initSidebar());
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';

    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      dispatch(setTheme(savedTheme)); // Apply saved theme
    }
  }, [dispatch]);
  useSystemTheme();

  return (
    <div className="flex min-h-screen dark:bg-gray-900 w-full max-w-full flex-col bg-muted/40 overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex flex-col sm:gap-4 sm:pt-4 transition-[padding] duration-300 ease-in-out w-full max-w-full min-w-0 overflow-x-hidden ${
          isSidebarOpen ? "sm:pl-20" : "sm:pl-0"
        }`}
      >
        <Topbar />
        <main className="grid bg-gray-100 dark:bg-gray-900 min-h-screen z-0 w-full max-w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
