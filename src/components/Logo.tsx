export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2.5" y="2.5" width="27" height="27" rx="7.5" stroke="hsl(var(--primary))" strokeWidth="2" />
      <rect x="8" y="18" width="3.5" height="7" rx="1" fill="hsl(var(--primary))" />
      <rect x="14.25" y="13" width="3.5" height="12" rx="1" fill="hsl(var(--chart-2))" />
      <rect x="20.5" y="9" width="3.5" height="16" rx="1" fill="hsl(var(--primary))" />
    </svg>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <LogoMark size={size} />
      <span className="font-extrabold tracking-display text-[1.15rem] leading-none">
        <span className="text-foreground">invoici</span>
        <span className="text-primary">ify</span>
      </span>
    </div>
  );
}
