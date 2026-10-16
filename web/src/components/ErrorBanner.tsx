export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-700" role="alert">{message}</p>;
}