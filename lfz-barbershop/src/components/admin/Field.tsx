export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-1 text-xs text-mute ${className}`}>{label}{children}</label>;
}
