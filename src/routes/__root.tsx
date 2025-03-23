import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <nav className="pt-6 px-6">
        {/* <header className="text-lg font-bold">Trainer</header> */}
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
})
