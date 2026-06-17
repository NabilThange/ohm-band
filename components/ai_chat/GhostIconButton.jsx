import React from "react";

export default function GhostIconButton({ label, children, onClick }) {
    return (
        <button
            className="hidden rounded-full border border-border bg-card/70 p-2 text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
            aria-label={label}
            title={label}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
