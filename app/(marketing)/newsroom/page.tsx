import { ArrowRight } from "lucide-react"

interface Article {
  title: string
  description: string
  date: string
  href: string
}

const articles: Article[] = [
  {
    title: "NYU Entrepreneurial Institute",
    description:
      "Pupil selected for NYU Entrepreneurial Institute's summer accelerator program.",
    date: "March 2026",
    href: "#",
  },
  {
    title: "Camelback Ventures Cohort 16",
    description:
      "Pupil joins Camelback Ventures Cohort 16, a program for entrepreneurs of color building equitable solutions.",
    date: "January 2026",
    href: "#",
  },
]

export default function NewsroomPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Newsroom
      </h1>

      {/* Article cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {articles.map((article) => (
          <a
            key={article.title}
            href={article.href}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-gray-500">{article.date}</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-[#7A60E4] transition-colors">
              {article.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-gray-600">
              {article.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A60E4]">
              Read more
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>

      {/* Media inquiries */}
      <div className="mt-16 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-700">
          For press inquiries, contact{" "}
          <a
            href="mailto:press@getpupil.com"
            className="font-medium text-[#7A60E4] hover:underline"
          >
            press@getpupil.com
          </a>
        </p>
      </div>
    </div>
  )
}
