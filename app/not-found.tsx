import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Pupil logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#7A60E4]" />
        <span className="text-2xl font-bold text-[#1A1A2E]">pupil</span>
      </Link>

      {/* 404 display */}
      <p className="text-[8rem] font-bold leading-none tracking-tighter text-gray-200 sm:text-[10rem]">
        404
      </p>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-base text-gray-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#7A60E4] px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6950d0]"
        >
          Go home
        </Link>
        <Link
          href="mailto:support@getpupil.com"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-transparent px-6 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
        >
          Contact support
        </Link>
      </div>
    </div>
  )
}
