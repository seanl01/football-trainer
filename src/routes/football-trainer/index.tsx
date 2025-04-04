import { createFileRoute, Link } from '@tanstack/react-router'
import '../../App.css'
import { Responsive } from '@/components/responsive'
import { Smartphone } from 'lucide-react'
import footballSvg from '@/assets/football.svg'

export const Route = createFileRoute('/football-trainer/')({
  component: App,
})

function App() {
  const modes = [
    {
      title: "Paired Reaction Trainer",
      link: "/football-trainer/pair",
      icon: (<section className="flex flex-row gap-1">
        <img src={footballSvg} alt="football" className="drop-shadow-md w-8" />
        <img src={footballSvg} alt="football" className="drop-shadow-md w-8" />
      </section>)
    },
    {
      title: "Individual Reaction Trainer",
      link: "/football-trainer/trainer",
      icon: <img src={footballSvg} alt="football" className="drop-shadow-md w-8" />
    }
  ] as const

  return (
    <div className="App">
      <h1 className="text-xl font-bold grid place-self-center text-center">Football Trainer</h1>
      <section className="grid grid-cols-1 gap-3 w-full pt-4">
        {
          modes.map((mode, index) => (
            <Link key={index} to={mode.link} className="btn btn-primary rounded-lg min-h-48 relative">
              {/* // <button key={index} className="card border bg-gradient-to-t from-green-800 to-green-700 border-green-900 inset-shadow-sm inset-shadow-green-600/80"> */}
              <section className="">
                <h2 className="text-2xl">{mode.title}</h2>
              </section>
              <section className="absolute bottom-5 right-5">
                {mode.icon}
              </section>
            </Link>
          ))
        }
      </section>

      {/* <Responsive
        xs={<div>xs content</div>}
        sm={<div>sm content</div>}
        md={<div>md content</div>}
        lg={<div>lg content</div>}
      // sm and lg are intentionally missing
      /> */}
    </div>
  )
}
