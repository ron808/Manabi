export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-xl border border-sakura-500/30 bg-sakura-500/10 px-4 py-3 text-sakura-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline text-xs">
          Retry
        </button>
      )}
    </div>
  );
}
