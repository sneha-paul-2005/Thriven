export function LogoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Horizontal line at top (T top bar) */}
      <line x1="6" y1="6" x2="18" y2="6" />

      {/* Vertical line down from center (T stem/arrow shaft) */}
      <line x1="12" y1="6" x2="12" y2="18" />

      {/* Arrow point at bottom */}
      <polyline points="8,14 12,18 16,14" />
    </svg>
  );
}
