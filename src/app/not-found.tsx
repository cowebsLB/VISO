import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="font-display text-4xl font-bold text-primary-600">404</h1>
      <p className="mt-2 text-slate-600">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary-500 px-8 py-3 font-semibold text-white shadow-soft"
      >
        Back home
      </Link>
    </div>
  );
}
