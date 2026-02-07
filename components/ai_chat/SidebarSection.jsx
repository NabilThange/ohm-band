import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/ui/animated-icons";

export default function SidebarSection({ icon, title, children, collapsed, onToggle }) {
    return (
        <section>
            <button
                onClick={onToggle}
                className="sticky top-0 z-10 -mx-2 mb-1 flex w-[calc(100%+16px)] items-center gap-2 border-y border-transparent bg-gradient-to-b from-sidebar to-sidebar/70 px-2 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground backdrop-blur hover:text-foreground"
                aria-expanded={!collapsed}
            >
                <span className="mr-1" aria-hidden>
                    {collapsed ? <ChevronRightIcon key="collapsed" size={14} triggerOn="auto" /> : <ChevronDownIcon key="expanded" size={14} triggerOn="auto" />}
                </span>
                <span className="flex items-center gap-2">
                    <span className="opacity-70" aria-hidden>
                        {icon}
                    </span>
                    {title}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-0.5"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
