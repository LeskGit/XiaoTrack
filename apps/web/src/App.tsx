import './assets/css/App.css'
import Header from './components/Header/Header.tsx'

export default function App() {

  let dateNew: Date = new Date();

  return (
    <div>
      <Header categorieName="On teste" date={dateNew} />
    </div>
  )
}

