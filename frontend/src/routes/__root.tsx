import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ThemeToggle } from '@/components/theme-toggle'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex gap-4 text-xl border-b p-4 items-center">
        <div className="font-bold text-xl mr-4 flex items-center gap-3">
          <img src="/Logo.png" alt="TMU Planner Logo" className="h-8 w-8" />
          TMU Planner
        </div>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
