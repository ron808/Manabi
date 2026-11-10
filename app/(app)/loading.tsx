export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading" data-route-loading>
      <div className="skeleton h-12 w-2/3 max-w-md" />
      <div className="skeleton h-44 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
      </div>
    </div>
  );
}
