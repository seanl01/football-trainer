import { createFileRoute, Link } from '@tanstack/react-router'
import '../../App.css'
import { Responsive } from '@/components/responsive'

export const Route = createFileRoute('/football-trainer/')({
  component: App,
})

function App() {
  return (
    <div className="App">
      Hello
      <Link to="/football-trainer/pair/leader">Create Pair</Link>

      <Responsive
        xs={<div>xs content</div>}
        sm={<div>sm content</div>}
        md={<div>md content</div>}
        lg={<div>lg content</div>}
      // sm and lg are intentionally missing
      />
    </div>
  )
}
