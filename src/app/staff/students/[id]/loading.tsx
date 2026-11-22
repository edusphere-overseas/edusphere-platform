/** Shown under the student's name while a tab loads. */
export default function StudentTabLoading() {
  return (
    <div className="grid grid-cols-1 animate-pulse gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-32 rounded-2xl bg-white" />
      <div className="h-48 rounded-2xl bg-white" />
    </div>
  );
}
