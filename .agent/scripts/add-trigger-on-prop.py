#!/usr/bin/env python3
"""
Script to add triggerOn prop support to all animated icon components.
This ensures consistent API across all 14 animated icons.
"""

import os
import re

# List of icon files to update (excluding check.tsx which is already done)
ICON_FILES = [
    'arrow-left.tsx',
    'arrow-right.tsx',
    'chevron-left.tsx',
    'chevron-right.tsx',
    'chevron-up.tsx',
    'chevron-down.tsx',
    'x.tsx',
    'copy.tsx',
    'download.tsx',
    'plus.tsx',
    'refresh-cw.tsx',
    'search.tsx',
    'zap.tsx',
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMPONENTS_DIR = os.path.join(BASE_DIR, '..', '..', 'components', 'ui')

def add_trigger_on_support(file_path):
    """Add triggerOn prop support to an icon component"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has triggerOn
    if 'triggerOn' in content:
        print(f"✓ {os.path.basename(file_path)} already has triggerOn support")
        return False
    
    # 1. Add useEffect import
    content = re.sub(
        r'import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";',
        'import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";',
        content
    )
    
    # 2. Add AnimationTrigger type export
    content = re.sub(
        r'(import { cn } from "@/lib/utils";)\n',
        r'\1\n\nexport type AnimationTrigger = \'hover\' | \'click\' | \'auto\' | \'none\';\n',
        content
    )
    
    # 3. Add triggerOn prop to interface
    # Find the Props interface and add triggerOn
    content = re.sub(
        r'(interface \w+Props extends HTMLAttributes<HTMLDivElement> {\n  size\?: number;)\n}',
        r'\1\n  /**\n   * Animation trigger mode:\n   * - \'hover\': Animate on mouse enter/leave (default)\n   * - \'click\': Animate on click\n   * - \'auto\': Auto-play animation on mount\n   * - \'none\': No animation (static icon)\n   */\n  triggerOn?: AnimationTrigger;\n}',
        content
    )
    
    # 4. Add triggerOn to forwardRef params
    content = re.sub(
        r'({ onMouseEnter, onMouseLeave, className, size = 28, \.\.\.props }, ref)',
        r'({ onMouseEnter, onMouseLeave, onClick, className, size = 28, triggerOn = \'hover\', ...props }, ref)',
        content
    )
    
    # 5. Add auto-play useEffect after useImperativeHandle
    auto_play_code = '''
    // Auto-play on mount
    useEffect(() => {
      if (triggerOn === 'auto') {
        controls.start("animate");
      }
    }, [triggerOn, controls]);
'''
    
    content = re.sub(
        r'(useImperativeHandle\(ref, \(\) => {[^}]+}\);)\n',
        r'\1\n' + auto_play_code + '\n',
        content,
        flags=re.DOTALL
    )
    
    # 6. Update handleMouseEnter
    content = re.sub(
        r'const handleMouseEnter = useCallback\(\n      \(e: React\.MouseEvent<HTMLDivElement>\) => {\n        if \(isControlledRef\.current\) {\n          onMouseEnter\?\.\(e\);\n        } else {\n          controls\.start\("animate"\);\n        }\n      },\n      \[controls, onMouseEnter\]',
        r'''const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseEnter?.(e);
        if (!isControlledRef.current && triggerOn === 'hover') {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter, triggerOn]''',
        content
    )
    
    # 7. Update handleMouseLeave
    content = re.sub(
        r'const handleMouseLeave = useCallback\(\n      \(e: React\.MouseEvent<HTMLDivElement>\) => {\n        if \(isControlledRef\.current\) {\n          onMouseLeave\?\.\(e\);\n        } else {\n          controls\.start\("normal"\);\n        }\n      },\n      \[controls, onMouseLeave\]',
        r'''const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(e);
        if (!isControlledRef.current && triggerOn === 'hover') {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave, triggerOn]''',
        content
    )
    
    # 8. Add handleClick callback before return statement
    click_handler = '''
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

    return ('''
    
    content = re.sub(
        r'return \(',
        click_handler,
        content,
        count=1
    )
    
    # 9. Add onClick handler to div
    content = re.sub(
        r'(<div[^>]*onMouseLeave={handleMouseLeave})',
        r'\1\n        onClick={handleClick}',
        content
    )
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {os.path.basename(file_path)} with triggerOn support")
    return True

def main():
    print("Adding triggerOn prop support to animated icons...\n")
    
    updated_count = 0
    for icon_file in ICON_FILES:
        file_path = os.path.join(COMPONENTS_DIR, icon_file)
        if os.path.exists(file_path):
            if add_trigger_on_support(file_path):
                updated_count += 1
        else:
            print(f"✗ File not found: {icon_file}")
    
    print(f"\n✅ Updated {updated_count}/{len(ICON_FILES)} icon files")
    print("✅ check.tsx was already updated manually")
    print(f"✅ Total icons with triggerOn support: {updated_count + 1}/14")

if __name__ == '__main__':
    main()
