/**
 * AdventureNameBanner -- Inline adventure name suggestion for Weaving
 *
 * Appears in the panel when the Sage suggests an adventure name
 * via the suggest_adventure_name tool. The user can approve the name
 * or edit it inline before confirming.
 *
 * States:
 *   pending   -- No name suggested yet (hidden)
 *   suggested -- Name shown with approve/edit actions
 *   approved  -- Name confirmed, shown as static text
 */

import { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface AdventureNameBannerProps {
  /** The suggested adventure name (null if none yet) */
  suggestedName: string | null;
  /** Whether the name has been approved */
  isApproved: boolean;
  /** Called when the user approves or edits the name */
  onApproveName: (name: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AdventureNameBanner({
  suggestedName,
  isApproved,
  onApproveName,
}: AdventureNameBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = useCallback(() => {
    setEditValue(suggestedName ?? '');
    setIsEditing(true);
  }, [suggestedName]);

  const handleConfirmEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onApproveName(trimmed);
      setIsEditing(false);
    }
  }, [editValue, onApproveName]);

  const handleApprove = useCallback(() => {
    if (suggestedName) {
      onApproveName(suggestedName);
    }
  }, [suggestedName, onApproveName]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleConfirmEdit();
      } else if (event.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [handleConfirmEdit]
  );

  // Not visible until a name is suggested
  if (!suggestedName) {
    return null;
  }

  return (
    <div className="detail-card--gold" style={bannerStyle}>
      <div className="flex items-center justify-between gap-3">
        {isEditing ? (
          <NameEditField
            value={editValue}
            onChange={setEditValue}
            onConfirm={handleConfirmEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <NameDisplay
            name={suggestedName}
            isApproved={isApproved}
            onApprove={handleApprove}
            onEdit={handleStartEdit}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface NameDisplayProps {
  name: string;
  isApproved: boolean;
  onApprove: () => void;
  onEdit: () => void;
}

function NameDisplay({ name, isApproved, onApprove, onEdit }: NameDisplayProps) {
  return (
    <>
      <span
        className="font-serif text-[15px] font-semibold flex-1 min-w-0 truncate"
        style={{ color: 'var(--accent-gold-hover)' }}
      >
        {name}
      </span>
      {isApproved ? (
        <span
          className="text-[11px] font-medium flex-shrink-0"
          style={{ color: 'var(--accent-gold)' }}
        >
          Approved
        </span>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <button
            className="text-[12px] font-medium"
            style={{ ...actionButtonStyle, color: 'var(--accent-gold)' }}
            onClick={onApprove}
            type="button"
          >
            Approve
          </button>
          <button
            className="text-[12px] font-medium"
            style={{ ...actionButtonStyle, color: 'var(--text-muted)' }}
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
        </div>
      )}
    </>
  );
}

interface NameEditFieldProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function NameEditField({
  value,
  onChange,
  onConfirm,
  onKeyDown,
}: NameEditFieldProps) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="font-serif text-[15px] font-semibold flex-1 min-w-0"
        style={editInputStyle}
        autoFocus
        aria-label="Edit adventure name"
      />
      <button
        className="text-[12px] font-medium flex-shrink-0"
        style={{ ...actionButtonStyle, color: 'var(--accent-gold)' }}
        onClick={onConfirm}
        type="button"
      >
        Confirm
      </button>
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const bannerStyle: React.CSSProperties = {
  padding: '10px 14px',
  margin: '0 var(--panel-padding) 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent-gold-dim)',
  borderColor: 'var(--accent-gold-border)',
  borderLeft: '3px solid var(--accent-gold)',
  border: '1px solid var(--accent-gold-border)',
};

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  transition: 'opacity 0.15s ease',
};

const editInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--accent-gold)',
  outline: 'none',
  color: 'var(--accent-gold-hover)',
  padding: '0 0 2px 0',
};
