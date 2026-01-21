/**
 * ConfirmCheckmark Component
 *
 * A visual indicator and toggle for dial confirmation state.
 * Displays a checkmark when the dial value has been confirmed by the user.
 *
 * Fantasy-themed with gold accent when confirmed.
 */

export interface ConfirmCheckmarkProps {
  /** Whether the dial is currently confirmed */
  confirmed: boolean;
  /** Callback when toggling confirmation state */
  onToggle: () => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Custom aria-label for the button */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export function ConfirmCheckmark({
  confirmed,
  onToggle,
  disabled = false,
  label,
  className = '',
}: ConfirmCheckmarkProps) {
  const defaultLabel = confirmed ? 'Unconfirm dial' : 'Confirm dial';
  const ariaLabel = label || defaultLabel;

  return (
    <button
      type="button"
      role="button"
      aria-pressed={confirmed}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onToggle()}
      className={`
        inline-flex items-center justify-center w-6 h-6 rounded-full
        border-2 transition-all
        focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-shadow-900
        ${
          confirmed
            ? 'bg-gold-600 border-gold-500 text-shadow-900'
            : 'bg-shadow-800 border-shadow-600 text-parchment-400 hover:border-shadow-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 transition-opacity ${confirmed ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
