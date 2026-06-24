export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" className={className} role="img" aria-label="Deutsch Start">
      <defs>
        <linearGradient id="ds-logo-grad" x1="16" y1="8" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC517" />
          <stop offset="0.55" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#E5231B" />
        </linearGradient>
      </defs>
      {/* Filled "D" with a right-pointing play triangle knocked out (negative space). */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 8 L32 8 C46.36 8 56 18.6 56 32 C56 45.4 46.36 56 32 56 L14 56 Z M27 21 L45.5 32 L27 43 Z"
        fill="url(#ds-logo-grad)"
      />
    </svg>
  );
}
