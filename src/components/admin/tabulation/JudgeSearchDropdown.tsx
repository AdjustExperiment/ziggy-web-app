import React, { useState, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Judge {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  specializations: string[];
  alumni: boolean;
}

interface Conflict {
  judge_profile_id: string;
  type: 'team' | 'school';
  registration_id?: string;
  school_name?: string;
}

interface JudgeSearchDropdownProps {
  judges: Judge[];
  selectedJudgeId: string | null;
  onSelect: (judgeId: string | null) => void;
  conflicts?: Conflict[];
  pairingAffRegistrationId?: string;
  pairingNegRegistrationId?: string;
  pairingSchools?: string[];
  assignedJudgeIds?: Set<string>;
  disabled?: boolean;
  placeholder?: string;
}

export function JudgeSearchDropdown({
  judges,
  selectedJudgeId,
  onSelect,
  conflicts = [],
  pairingAffRegistrationId,
  pairingNegRegistrationId,
  pairingSchools = [],
  assignedJudgeIds = new Set(),
  disabled = false,
  placeholder = 'Select judge...'
}: JudgeSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedJudge = useMemo(() => 
    judges.find(j => j.id === selectedJudgeId),
    [judges, selectedJudgeId]
  );

  const getJudgeConflicts = (judgeId: string): Conflict[] => {
    return conflicts.filter(c => {
      if (c.judge_profile_id !== judgeId) return false;
      if (c.type === 'team') {
        return c.registration_id === pairingAffRegistrationId || 
               c.registration_id === pairingNegRegistrationId;
      }
      if (c.type === 'school') {
        return pairingSchools.some(s => 
          s.toLowerCase() === c.school_name?.toLowerCase()
        );
      }
      return false;
    });
  };

  const sortedJudges = useMemo(() => {
    const filtered = judges.filter(j => 
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.email.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aConflicts = getJudgeConflicts(a.id).length;
      const bConflicts = getJudgeConflicts(b.id).length;
      const aAssigned = assignedJudgeIds.has(a.id);
      const bAssigned = assignedJudgeIds.has(b.id);

      // Selected judge first
      if (a.id === selectedJudgeId) return -1;
      if (b.id === selectedJudgeId) return 1;

      // Non-conflicted, non-assigned judges first
      if (aConflicts === 0 && bConflicts > 0) return -1;
      if (bConflicts === 0 && aConflicts > 0) return 1;
      if (!aAssigned && bAssigned) return -1;
      if (!bAssigned && aAssigned) return 1;

      // Sort by name
      return a.name.localeCompare(b.name);
    });
  }, [judges, search, selectedJudgeId, assignedJudgeIds, conflicts]);

  const experienceLevelLabel = (level: string) => {
    switch (level) {
      case 'expert': return 'Expert';
      case 'intermediate': return 'Intermediate';
      case 'novice': return 'Novice';
      default: return level;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between h-8 text-sm font-normal',
            !selectedJudge && 'text-muted-foreground'
          )}
        >
          {selectedJudge ? (
            <span className="flex items-center gap-2 truncate">
              <User className="h-3 w-3" />
              {selectedJudge.name}
              {selectedJudge.alumni && (
                <Badge variant="secondary" className="text-xs px-1 py-0">A</Badge>
              )}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search judges..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No judges found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    !selectedJudgeId ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="text-muted-foreground">No judge assigned</span>
              </CommandItem>
              {sortedJudges.map((judge) => {
                const judgeConflicts = getJudgeConflicts(judge.id);
                const hasConflict = judgeConflicts.length > 0;
                const isAssigned = assignedJudgeIds.has(judge.id) && judge.id !== selectedJudgeId;

                return (
                  <CommandItem
                    key={judge.id}
                    value={judge.id}
                    onSelect={() => {
                      onSelect(judge.id);
                      setOpen(false);
                    }}
                    className={cn(
                      hasConflict && 'opacity-50',
                      isAssigned && 'bg-muted/30'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedJudgeId === judge.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{judge.name}</span>
                        {judge.alumni && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 shrink-0">A</Badge>
                        )}
                        {hasConflict && (
                          <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                        )}
                        {isAssigned && (
                          <Badge variant="outline" className="text-xs px-1 py-0 shrink-0">Assigned</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{experienceLevelLabel(judge.experience_level)}</span>
                        {judge.specializations.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{judge.specializations.slice(0, 3).join(', ')}</span>
                          </>
                        )}
                      </div>
                      {hasConflict && (
                        <div className="text-xs text-warning mt-0.5">
                          {judgeConflicts.map((c, i) => (
                            <span key={i}>
                              {c.type === 'school' ? `School: ${c.school_name}` : 'Team conflict'}
                              {i < judgeConflicts.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
