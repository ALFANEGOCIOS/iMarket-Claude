"use client";

import { Toaster as Sonner } from "sonner";

function Toaster(props) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      style={{
        "--normal-bg": "var(--card)",
        "--normal-text": "var(--card-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
}

export { Toaster };
