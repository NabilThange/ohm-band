"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export type AnimationTrigger = 'hover' | 'click' | 'auto' | 'none';

export interface XIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface XIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  /**
   * Animation trigger mode:
   * - 'hover': Animate on mouse enter/leave (default)
   * - 'click': Animate on click
   * - 'auto': Auto-play animation on mount
   * - 'none': No animation (static icon)
   */
  triggerOn?: AnimationTrigger;
}

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
  },
};

const XIcon = forwardRef<XIconHandle, XIconProps>(
  ({ onMouseEnter, onMouseLeave, onClick, className, size = 28, triggerOn = 'hover', ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    // Auto-play on mount
    useEffect(() => {
      if (triggerOn === 'auto') {
        controls.start("animate");
      }
    }, [triggerOn, controls]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseEnter?.(e);
        if (!isControlledRef.current && triggerOn === 'hover') {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter, triggerOn]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(e);
        if (!isControlledRef.current && triggerOn === 'hover') {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave, triggerOn]
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(e);
        if (!isControlledRef.current && triggerOn === 'click') {
          controls.start("animate").then(() => {
            // Return to normal after animation completes
            setTimeout(() => controls.start("normal"), 100);
          });
        }
      },
      [controls, onClick, triggerOn]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M18 6 6 18"
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="m6 6 12 12"
            transition={{ delay: 0.2 }}
            variants={PATH_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

XIcon.displayName = "XIcon";

export { XIcon };
