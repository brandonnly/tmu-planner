import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AcademicPlanner } from '@/components/academic-planner'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold p-4 border-b">TMU Course Planner</h1>
      <div className="flex-1 min-h-0">
        <AcademicPlanner />
      </div>
    </div>
  )
}
