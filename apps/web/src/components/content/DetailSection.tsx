import { useState } from 'react';

export interface DetailSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({
  title,
  defaultExpanded = false,
  children,
  className = '',
}: DetailSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`border-b border-ink-200 dark:border-shadow-700 last:border-b-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full py-3 px-0 text-left group"
      >
        <span
          className={`
            text-[10px] text-ink-400 dark:text-parchment-600
            transition-transform duration-200 flex-shrink-0 w-3.5 text-center
            ${expanded ? 'rotate-90' : ''}
          `}
        >
          &#x25B8;
        </span>
        <span
          className={`
            font-serif text-[13px] font-medium transition-colors duration-150
            ${expanded ? 'text-gold-500 dark:text-gold-400' : 'text-ink-500 dark:text-parchment-500'}
            group-hover:text-gold-500 dark:group-hover:text-gold-400
          `}
        >
          {title}
        </span>
      </button>

      {expanded && (
        <div className="pb-3 pl-[22px] text-[13px] text-ink-600 dark:text-parchment-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
