import { cn } from "@/lib/cn";

export function Button({
  children,
  className,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "cursor-pointer rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium !text-white transition hover:bg-[color:var(--accent-hover)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[color:var(--accent)]",
        className
      )}
    >
      {children}
    </button>
  );
}