import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/football-trainer/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="">
    <Link to="/football-trainer" className="p-1 btn btn-ghost">
      <ChevronLeft/>
      Home
    </Link>
    <Outlet />
  </div>
}
