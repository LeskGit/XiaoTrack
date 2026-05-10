import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSiderbar'
import MainContent from './MainContent/MainContent';
import AppHeader from './Header/AppHeader';

export default function MainLayout() {

    const date = new Date();

    return (
        <div className='grid md:grid-cols-[16rem_1fr] grid-rows-[auto_1fr] h-screen gap-1'>
            <AppHeader />                
            <MainHeader categorieName="Dashboard" date={date} />
            <MainSidebar></MainSidebar>
            <MainContent></MainContent>
        </div>
    )
}