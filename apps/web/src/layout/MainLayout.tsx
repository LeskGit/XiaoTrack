import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSiderbar'

export default function MainLayout() {

    const date = new Date();

    return (
        <div className='grid'>
            <MainHeader categorieName="Tableau de bord" date={date} />
            <MainSidebar></MainSidebar>
        </div>
    )
}