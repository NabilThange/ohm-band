"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export type AnimationTrigger = 'hover' | 'click' | 'auto' | 'none';

export interface ChevronDownIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChevronDownIconProps extends HTMLAttributes<HTMLDivElement> {
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

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const ChevronDownIcon = forwardRef<ChevronDownIconHandle, ChevronDownIconProps>(
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
            d="m6 9 6 6 6-6"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { y: 0 },
              animate: { y: [0, 2, 0] },
            }}
          />
        </svg>
      </div>
    );
  }
);

ChevronDownIcon.displayName = "ChevronDownIcon";

export { ChevronDownIcon };
