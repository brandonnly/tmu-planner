
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex gap-2 text-lg border-b p-2">
        <div className="font-bold text-lg mr-4 flex items-center gap-2">
          <img src="/Logo.png" alt="TMU Planner Logo" className="h-6 w-6" />
          TMU Planner
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
