import { NextResponse } from 'next/server'

import { searchColleges } from '@/lib/data/colleges-majors'

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  const colleges = await searchColleges(q.slice(0, 120))

  return NextResponse.json(
    { colleges },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  )
}
