"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronRightIcon, ChevronDownIcon } from "@/components/ui/animated-icons"
import { FolderIcon, MoreHorizontal } from "lucide-react"
import ConversationRow from "./ConversationRow"
import { motion, AnimatePresence } from "framer-motion"

export default function FolderRow({
    name,
    count,
    conversations = [],
    selectedId,
    onSelect,
    togglePin,
    onDeleteFolder,
    onRenameFolder,
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showMenu])

    const handleToggle = () => {
        setIsExpanded(!isExpanded)
    }

    const handleRename = () => {
        const newName = prompt(`Rename folder "${name}" to:`, name)
        if (newName && newName.trim() && newName !== name) {
            onRenameFolder?.(name, newName.trim())
        }
        setShowMenu(false)
    }

    const handleDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete the folder "${name}"? This will move all conversations to the root level.`,
            )
        ) {
            onDeleteFolder?.(name)
        }
        setShowMenu(false)
    }

    return (
        <div className="group">
            <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-accent">
                <button onClick={handleToggle} className="flex items-center gap-2 flex-1 text-left">
                    {isExpanded ? (
                        <ChevronDownIcon key="expanded" size={16} triggerOn="auto" className="text-zinc-500" />
                    ) : (
                        <ChevronRightIcon key="collapsed" size={16} triggerOn="auto" className="text-zinc-500" />
                    )}
                    <FolderIcon className="h-4 w-4" />
                    <span className="truncate">{name}</span>
                </button>

                <div className="flex items-center gap-1">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {count}
                    </span>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
                        >
                            <MoreHorizontal className="h-3 w-3" />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-border bg-popover py-1 shadow-lg z-[100]"
                                >
                                    <button
                                        onClick={handleRename}
                                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent"
                                    >
                                        Rename
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-accent"
                                    >
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-6 space-y-1 py-1">
                            {conversations.map((conversation) => (
                                <ConversationRow
                                    key={conversation.id}
                                    data={conversation}
                                    active={conversation.id === selectedId}
                                    onSelect={() => onSelect(conversation.id)}
                                    onTogglePin={() => togglePin(conversation.id)}
                                    showMeta
                                />
                            ))}
                            {conversations.length === 0 && (
                                <div className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    No conversations in this folder
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
