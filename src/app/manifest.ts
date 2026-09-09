import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SyncUp - All Productivity Apps in One Place",
    short_name: "SyncUp",
    description: "Organize, schedule, and prioritize your daily tasks with ease.",
    start_url: "/todoList",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#14b8a6",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "utilities"],
    shortcuts: [
      {
        name: "Todo List",
        short_name: "Todos",
        description: "Open Todo List & Calendar",
        url: "/todoList",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Finance Tracker",
        short_name: "Finance",
        description: "Open Finance Tracker",
        url: "/finance-tracker",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Habit Tracker",
        short_name: "Habits",
        description: "Open Habit Tracker",
        url: "/habit-tracker",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Notepad",
        short_name: "Notes",
        description: "Open Notepad",
        url: "/notepad",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
