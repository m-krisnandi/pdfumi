export function ToolShell({
  title,
  description,
  children,
  wide = true,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
      <div className="space-y-2 mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl">
          {description}
        </p>
      </div>
      <div className="space-y-6 rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
