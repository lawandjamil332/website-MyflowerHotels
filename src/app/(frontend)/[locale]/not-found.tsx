import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-32 sm:px-6">
      <h1 className="font-display text-4xl text-stone-900">404</h1>
      <p className="mt-3 text-stone-500">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
      >
        Go to the homepage
      </Link>
    </div>
  )
}
