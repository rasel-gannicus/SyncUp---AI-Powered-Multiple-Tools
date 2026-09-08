"use client";

import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { toggleSidebar } from "@/Redux/features/Sidebar/sidebarSlice";
import { NavLink } from "@/utils/Navlink/NavLink";
import { LinkArray } from "./Link";
import { PanelLeftClose } from "lucide-react";

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => state.sidebar?.isOpen ?? true);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 hidden sm:flex flex-col border-r border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-all duration-300 ease-in-out shadow-sm ${
        isSidebarOpen
          ? "w-20 translate-x-0 opacity-100 pointer-events-auto"
          : "w-20 -translate-x-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Top Sidebar Header with Collapse Button */}
      <div className="flex items-center justify-center pt-3 pb-1">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          title="Collapse Sidebar"
          aria-label="Collapse Sidebar"
          className="p-2 rounded-xl text-gray-400 hover:text-teal-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col items-center gap-2 px-2 py-3 overflow-y-auto overflow-x-hidden flex-grow">
        {LinkArray.map((link) => (
          <NavLink
            key={link.hrefLink}
            href={link.hrefLink}
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-800/60 flex-col gap-y-1 [&.active]:bg-teal-500/10 dark:[&.active]:bg-orange-500/15 [&.active]:text-teal-600 dark:[&.active]:text-orange-400 [&.active]:font-semibold [&.active]:shadow-sm active:scale-95"
            prefetch={true}
          >
            {link.iconForSidebarMenu()}
            <span className="text-center text-[11px] font-medium leading-tight">
              {link.linkTitle}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
