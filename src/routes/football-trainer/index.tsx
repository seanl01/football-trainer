import { createFileRoute, Link } from '@tanstack/react-router'
import '../../App.css'

export const Route = createFileRoute('/football-trainer/')({
  component: App,
})

function App() {
  return (
    <div className="App">
      Hello
      <Link to="/football-trainer/pair/leader">Create Pair</Link>
    </div>
  )
}
