import { clsx } from "clsx";
import type { ReactNode, HTMLAttributes } from "react";

export function Card({
  className,
  hoverable = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-lg bg-surface/70 backdrop-blur-sm",
        "border border-white/[0.06]",
        "shadow-glow",
        hoverable && "transition-colors hover:border-white/[0.12]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
      <div>
        <h3 className="font-serif text-base font-medium tracking-tight text-zinc-50">{title}</h3>
        {subtitle ? <p className="text-2xs text-subtle mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}
