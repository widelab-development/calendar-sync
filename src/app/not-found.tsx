import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="mt-4 text-xl text-gray-400">
          Strona nie została znaleziona
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Wróć do strony głównej
        </Link>
      </div>
    </div>
  );
}
