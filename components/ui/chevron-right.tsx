"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export type AnimationTrigger = 'hover' | 'click' | 'auto' | 'none';

export interface ChevronRightIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChevronRightIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  triggerOn?: AnimationTrigger;
}

const DEFAULT_TRANSITION: Transition = {
  times: [0, 0.4, 1],
  duration: 0.5,
};

const ChevronRightIcon = forwardRef<
  ChevronRightIconHandle,
  ChevronRightIconProps
>(({ onMouseEnter, onMouseLeave, onClick, className, size = 28, triggerOn = 'hover', ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    };
  });

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
          d="m9 18 6-6-6-6"
          transition={DEFAULT_TRANSITION}
          variants={{
            normal: { x: 0 },
            animate: { x: [0, 2, 0] },
          }}
        />
      </svg>
    </div>
  );
});

ChevronRightIcon.displayName = "ChevronRightIcon";

export { ChevronRightIcon };
