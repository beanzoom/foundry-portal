/**
 * Admin Dropdown Menu Component
 *
 * Displays a dropdown menu for grouped navigation sections.
 * Features:
 * - Hover and click to open
 * - Keyboard navigation (Tab, Enter, Esc, Arrow keys)
 * - Active route highlighting
 * - Status badges (new, planned, beta)
 * - Item badges (counts, notifications)
 * - Accessible (ARIA labels, focus management)
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { type NavGroup, isPathActive } from './navigation-config';

interface AdminDropdownMenuProps {
  section: NavGroup;
  className?: string;
}

export function AdminDropdownMenu({ section, className }: AdminDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Check if any item in this group is active
  const isGroupActive = section.items.some(item =>
    isPathActive(location.pathname, item.path)
  );

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (e.key === 'ArrowDown') {
          setFocusedIndex(prev => (prev + 1) % section.items.length);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => (prev - 1 + section.items.length) % section.items.length);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;

      case 'Tab':
        // Allow tabbing away to close
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle item keyboard activation
  const handleItemKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Link will handle navigation
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {/* Dropdown Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
          isGroupActive || isOpen
            ? "border-purple-600 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-purple-300"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${section.label} menu`}
      >
        <section.icon className="w-5 h-5" />
        {section.label}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu - Rendered via Portal for proper overlay positioning */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100]"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={section.id}
          style={{
            top: `${dropdownPosition.top + 4}px`,
            left: `${dropdownPosition.left}px`,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Section description */}
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
            {section.description}
          </div>

          {/* Menu items */}
          {section.items.map((item, index) => {
            const isActive = isPathActive(location.pathname, item.path);
            const isFocused = focusedIndex === index;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                role="menuitem"
                tabIndex={isFocused ? 0 : -1}
                onKeyDown={(e) => handleItemKeyDown(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onClick={() => {
                  setIsOpen(false);
                  setFocusedIndex(-1);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-50",
                  item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-purple-600" : "text-gray-400"
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.label}</span>

                    {/* Status badge */}
                    {item.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0",
                          item.status === 'new' && "bg-green-50 text-green-700 border-green-200",
                          item.status === 'planned' && "bg-blue-50 text-blue-700 border-blue-200",
                          item.status === 'beta' && "bg-orange-50 text-orange-700 border-orange-200"
                        )}
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    )}

                    {/* Count badge */}
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 bg-gray-100 text-gray-700"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
