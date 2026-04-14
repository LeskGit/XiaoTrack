import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSiderbar'

export default function MainLayout() {

    const date = new Date();

    return (
        <div className='grid md:grid-cols-[16rem_1fr]'>
            <div className='col-span-full'>
                <MainHeader categorieName="Tableau de bord" date={date} />
            </div>
            <div className=''>
                <MainSidebar></MainSidebar>
            </div>
        </div>
    )
}