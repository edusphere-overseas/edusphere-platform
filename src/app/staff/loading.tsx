/** Shown straight away while a staff page loads. */
export default function StaffLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-deep/8" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-deep/6" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl bg-white" />
        <div className="h-40 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
