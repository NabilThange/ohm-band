"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant"
  children: React.ReactNode
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ from, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-from={from}
        className={cn(
          "group flex gap-3",
          from === "user" ? "flex-row-reverse" : "flex-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Message.displayName = "Message"

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "contained" | "flat"
  children: React.ReactNode
}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ variant = "contained", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm w-fit",
          "group-data-[from=user]:max-w-[85%]",
          "group-data-[from=assistant]:max-w-[725px]",
          variant === "contained" && [
            "shadow-sm",
            "group-data-[from=user]:bg-accent group-data-[from=user]:text-foreground",
            "group-data-[from=assistant]:bg-[#272626] group-data-[from=assistant]:text-white",
          ],
          variant === "flat" && [
            "group-data-[from=user]:bg-accent group-data-[from=user]:text-foreground group-data-[from=user]:shadow-sm",
            "group-data-[from=assistant]:bg-[#272626] group-data-[from=assistant]:text-white",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MessageContent.displayName = "MessageContent"

interface MessageAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  src?: string
  name?: string
  fallback?: string
  children?: React.ReactNode
}

const MessageAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  MessageAvatarProps
>(({ src, name, fallback, children, className, ...props }, ref) => {
  // If fallback is provided (emoji), use it directly
  // Otherwise extract initials from name
  const fallbackContent = fallback || (name
    ? name.length <= 2
      ? name.toUpperCase()
      : name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?")

  return (
    <Avatar
      ref={ref}
      className={cn("h-8 w-8 flex-shrink-0 ring-1 ring-border", className)}
      {...props}
    >
      {src && <AvatarImage src={src} alt={name || "Avatar"} />}
      <AvatarFallback
        className={cn(
          "text-xs font-bold",
          "bg-primary text-primary-foreground"
        )}
      >
        {children || fallbackContent}
      </AvatarFallback>
    </Avatar>
  )
})
MessageAvatar.displayName = "MessageAvatar"

export { Message, MessageContent, MessageAvatar }
