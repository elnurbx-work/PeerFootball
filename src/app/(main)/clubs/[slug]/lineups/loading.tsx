export default function LineupsLoading() {
  return <div className="mx-auto grid max-w-6xl animate-pulse gap-5 px-4 py-8"><div className="h-10 w-1/2 rounded bg-secondary" /><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-48 rounded-xl bg-secondary" />)}</div></div>;
}
