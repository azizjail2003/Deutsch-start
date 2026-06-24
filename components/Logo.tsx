export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" className={className} role="img" aria-label="Deutsch Start">
      {/* Solid "D" with an open doorway knocked out (the gap shows the background,
          so the mark works in light and dark themes). D = currentColor. */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 7 L31 7 C45.3 7 55 17.6 55 32 C55 46.4 45.3 57 31 57 L13 57 Z
           M22 24 L35 20 L35 51 L22 51 Z"
        fill="currentColor"
      />
      {/* Gold door leaf (slightly ajar, hinged on the right). */}
      <path d="M24.5 26.6 L35 23.5 L35 49 L24.5 49 Z" fill="#B8860B" />
    </svg>
  );
}
