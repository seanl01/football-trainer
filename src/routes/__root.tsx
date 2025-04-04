import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import "../App.css"

export const Route = createRootRoute({
  component: () => (
    <>
      <main className="p-6 overflow-x-hidden">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
})
