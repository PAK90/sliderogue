
import './App.css'
import { Analytics } from '@vercel/analytics/react';
import GameArea from "./GameArea.tsx";

function App() {
  return (
    <div>
      <Analytics/>
      <h1 className="text-5xl font-bold underline text-center p-5">SlideRogue</h1>
      <GameArea/>
    </div>
  )
}

export default App
