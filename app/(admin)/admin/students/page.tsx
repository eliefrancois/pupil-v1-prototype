"use client"

import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const STUDENTS = [
  { id: "s1", name: "Riley Park", grade: 11, school: "West Mesa High School", mentor: "Amara Okafor", sessions: 4 },
  { id: "s2", name: "Jordan Tate", grade: 12, school: "Roosevelt HS", mentor: "Priya Raman", sessions: 2 },
  { id: "s3", name: "Marcus Bell", grade: 11, school: "Garfield HS", mentor: "Jonas Lindqvist", sessions: 6 },
  { id: "s4", name: "Sofia Reyes", grade: 11, school: "Garfield HS Chicago", mentor: "Diego Hernandez", sessions: 3 },
  { id: "s5", name: "Theo Bennett", grade: 10, school: "Lakeside School", mentor: "Sasha Chen", sessions: 1 },
  { id: "s6", name: "Anya Petrov", grade: 10, school: "Central HS", mentor: "Maya Goldberg", sessions: 5 },
  { id: "s7", name: "Tasha Williams", grade: 11, school: "Roosevelt HS", mentor: "Amara Okafor", sessions: 7 },
]

export default function StudentsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="mt-1 text-sm text-gray-500">1,840 enrolled</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Student</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Grade</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">School</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Mentor</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {STUDENTS.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar alt={student.name} size="sm" />
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.grade}</td>
                      <td className="px-6 py-4 text-gray-600">{student.school}</td>
                      <td className="px-6 py-4 text-gray-600">{student.mentor}</td>
                      <td className="px-6 py-4 text-gray-600">{student.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
