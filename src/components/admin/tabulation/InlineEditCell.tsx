import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => Promise<boolean>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditCell({ 
  value, 
  onSave, 
  placeholder = 'Click to edit',
  className,
  disabled = false
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setHasError(false);

    const success = await onSave(editValue);
    
    setIsSaving(false);
    
    if (success) {
      setIsEditing(false);
    } else {
      setHasError(true);
      setEditValue(value);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setHasError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <div className={cn('px-2 py-1 text-muted-foreground', className)}>
        {value || '-'}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'h-8 text-sm',
            hasError && 'border-destructive',
            className
          )}
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'group flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted/50 transition-colors min-h-[32px]',
        className
      )}
    >
      <span className={cn(!value && 'text-muted-foreground')}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}
