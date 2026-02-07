/**
 * Animated Icons Barrel Export
 * 
 * Centralized export for all animated icon components.
 * These icons use Framer Motion for smooth, purposeful micro-interactions.
 * 
 * Usage:
 * import { ChevronLeftIcon, XIcon, ArrowLeftIcon } from '@/components/ui/animated-icons';
 * 
 * All icons support:
 * - size prop (default: 28)
 * - className for styling
 * - Imperative handle for programmatic control (startAnimation, stopAnimation)
 * - triggerOn prop for context-appropriate animations:
 *   - 'hover': Animate on mouse enter/leave (default)
 *   - 'click': Animate on click
 *   - 'auto': Auto-play on mount (for state indicators)
 *   - 'none': No animation (static icon)
 * 
 * Examples:
 * <CheckIcon triggerOn="auto" />  // Success indicator - animates on mount
 * <ChevronDownIcon triggerOn="hover" />  // Navigation - animates on hover (default)
 * <XIcon triggerOn="click" />  // Close button - animates on click
 */

// Export AnimationTrigger type for consumers
export type { AnimationTrigger } from './check';

// Navigation Icons
export { ArrowLeftIcon } from './arrow-left';
export { ArrowRightIcon } from './arrow-right';
export { ChevronLeftIcon } from './chevron-left';
export { ChevronRightIcon } from './chevron-right';
export { ChevronUpIcon } from './chevron-up';
export { ChevronDownIcon } from './chevron-down';

// Action Icons
export { CheckIcon } from './check';
export { XIcon } from './x';
export { CopyIcon } from './copy';
export { DownloadIcon } from './download';
export { PlusIcon } from './plus';
export { RefreshCwIcon } from './refresh-cw';
export { SearchIcon } from './search';
export { ZapIcon } from './zap';

// Export type definitions
export type { ArrowLeftIconHandle } from './arrow-left';
export type { ArrowRightIconHandle } from './arrow-right';
export type { ChevronLeftIconHandle } from './chevron-left';
export type { ChevronRightIconHandle } from './chevron-right';
export type { ChevronUpIconHandle } from './chevron-up';
export type { ChevronDownIconHandle } from './chevron-down';
export type { CheckIconHandle } from './check';
export type { XIconHandle } from './x';
export type { CopyIconHandle } from './copy';
export type { DownloadIconHandle } from './download';
export type { PlusIconHandle } from './plus';
export type { RefreshCwIconHandle } from './refresh-cw';
export type { SearchIconHandle } from './search';
export type { ZapIconHandle } from './zap';
