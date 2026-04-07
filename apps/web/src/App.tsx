import MainHeader from '@/layout/Header/MainHeader';
import MainSidebar from './layout/Sidebar/MainSiderbar';

export default function App() {

  let dateNew: Date = new Date();

  return (
    <div className='grid grid-cols-7'>
      <MainHeader categorieName="Tableau de bord" date={dateNew} />
      <MainSidebar></MainSidebar>
    </div>

  )
}

