import './assets/css/App.css'
import MainHeader from './layout/Header/MainHeader';

export default function App() {

  let dateNew: Date = new Date();

  return (
    <div>
      <MainHeader categorieName="On teste" date={dateNew} />
    </div>
  )
}

