"use client";

import { useEffect } from "react";

export const PWARegister = () => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA ServiceWorker registration successful:", registration.scope);
        })
        .catch((err) => {
          console.warn("PWA ServiceWorker registration failed:", err);
        });
    }
  }, []);

  return null;
};
