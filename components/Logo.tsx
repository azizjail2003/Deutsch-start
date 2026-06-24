/* eslint-disable @next/next/no-img-element */
export default function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/icon-tile.png"
      alt="Deutsch Start"
      width={36}
      height={36}
      className={className}
      draggable={false}
    />
  );
}
