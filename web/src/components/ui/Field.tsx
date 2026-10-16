export function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const controlled = value !== undefined;
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[color:var(--ink)]/80">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        {...(controlled
          ? {
              value,
              onChange: (e) => onChange?.(e.target.value),
            }
          : { defaultValue })}
        className="w-full rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]"
      />
    </label>
  );
}
