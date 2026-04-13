import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSiderbar'

export default function MainLayout() {

    const date = new Date();

    return (
        <div className='grid md:grid-cols-[20%_1fr]'>
            <div className='col-span-2'>
                <MainHeader categorieName="Tableau de bord" date={date} />
            </div>
            <div className=''>
                <MainSidebar></MainSidebar>
            </div>
        </div>
    )
}