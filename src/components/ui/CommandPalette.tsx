import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, Loader2 } from 'lucide-react';
import { useHelpCommands } from '@/hooks/useHelpCommands';
import { useSimpleNavigationCommands } from '@/hooks/useSimpleNavigationCommands';
import { useBuiltInCommands } from '@/hooks/useBuiltInCommands';
import { COMMAND_CATEGORIES } from '@/types/command';
import type { Command as CommandType, CommandCategory } from '@/types/command';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Fetch commands from different sources
  const { commands: helpCommands, loading: helpLoading } = useHelpCommands();
  const { commands: navCommands, loading: navLoading } = useSimpleNavigationCommands();
  const { commands: builtInCommands } = useBuiltInCommands();

  // Memoize combined commands to prevent unnecessary recalculations
  const allCommands = useMemo(() => [
    ...builtInCommands,
    ...navCommands,
    ...helpCommands,
  ], [builtInCommands, navCommands, helpCommands]);

  const loading = helpLoading || navLoading;

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, CommandType[]> = {
      navigation: [],
      help: [],
      actions: [],
    };

    allCommands.forEach(command => {
      if (groups[command.category]) {
        groups[command.category].push(command);
      }
    });

    // Sort commands within each group by priority
    Object.keys(groups).forEach(category => {
      groups[category as CommandCategory].sort((a, b) => 
        (a.priority || 999) - (b.priority || 999)
      );
    });

    return groups;
  }, [allCommands]);

  // Filter out empty groups and sort by category priority
  const visibleGroups = useMemo(() => {
    return Object.entries(COMMAND_CATEGORIES)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([category, config]) => ({
        category: category as CommandCategory,
        label: config.label,
        commands: groupedCommands[category as CommandCategory] || [],
      }))
      .filter(group => group.commands.length > 0);
  }, [groupedCommands]);

  // Handle command selection
  const handleSelect = (command: CommandType) => {
    command.action();
    onClose();
    setSearch('');
  };

  // Handle focus and escape key
  useEffect(() => {
    if (open) {
      // Focus the input when palette opens
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // Small delay to ensure DOM is ready

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Clear search when closing
      setSearch('');
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[60vh] overflow-hidden">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search commands, help articles, and navigation..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading commands...
                </span>
              </div>
            ) : (
              <>
                {visibleGroups.map(group => (
                  <Command.Group key={group.category} heading={group.label}>
                    {group.commands.map(command => {
                      const Icon = command.icon;
                      return (
                        <Command.Item
                          key={command.id}
                          value={`${command.title} ${command.description} ${command.searchTerms?.join(' ')}`}
                          onSelect={() => handleSelect(command)}
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 data-[selected]:bg-gray-100"
                        >
                          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {command.title}
                            </div>
                            {command.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <div className="text-xs text-gray-400 font-mono">
                              {command.shortcut}
                            </div>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}

                {visibleGroups.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
                    <div className="text-sm text-muted-foreground mb-2">
                      {search ? 'No commands found' : 'Start typing to search...'}
                    </div>
                    {!search && (
                      <div className="text-xs text-muted-foreground/75 space-y-1">
                        <div>Try: "dashboard", "users", "help", "maintenance"</div>
                        <div>Or type "tutorial" for getting started</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}