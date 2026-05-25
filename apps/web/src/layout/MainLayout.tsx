import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSidebar'
import MainContent from './MainContent/MainContent';
import AppHeader from './Header/AppHeader';

export default function MainLayout() {


    return (
        <div className='grid md:grid-cols-[16rem_1fr] grid-rows-[auto_1fr] h-screen gap-1'>
            <AppHeader />                
            <MainHeader />
            <MainSidebar></MainSidebar>
            <MainContent></MainContent>
        </div>
    )
}