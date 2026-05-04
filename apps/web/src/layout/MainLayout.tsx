import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSiderbar'
import MainContent from './MainContent/MainContent';

export default function MainLayout() {

    const date = new Date();

    return (
        <div className='grid md:grid-cols-[16rem_1fr] grid-rows-[auto_1fr] h-screen gap-1'>
            <div className='col-span-full'>
                <MainHeader categorieName="Tableau de bord" date={date} />
            </div>
            <div className='shadow-sm'>
                <MainSidebar></MainSidebar>
            </div>
            <div className='shadow-sm'>
                <MainContent></MainContent>
            </div>
        </div>
    )
}