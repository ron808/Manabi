export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-24 w-full ${className}`} />;
}

export function SkeletonLine({
  width = "100%",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div className={`skeleton h-3 ${className}`} style={{ width }} />
  );
}
