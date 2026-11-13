import MainHeader from './Header/MainHeader'
import MainSidebar from './Sidebar/MainSidebar'
import MainContent from './MainContent/MainContent';
import AppHeader from './Header/AppHeader';

/**
 * App shell: brand + header on top, sidebar + content below.
 * The shell is exactly the screen height and never scrolls: only MainContent does (and the sidebar,
 * if its menu gets too long). The header and the sidebar stay in place, as plain panels over the canvas.
 * minmax(0, 1fr): the content row may shrink below its content's height, so it scrolls instead of growing.
 * Below md the four blocks stack (brand, header, sidebar, content).
 */
export default function MainLayout() {


    return (
        <div className='grid h-dvh overflow-hidden grid-rows-[auto_auto_auto_minmax(0,1fr)] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_minmax(0,1fr)]'>
            <AppHeader />
            <MainHeader />
            <MainSidebar></MainSidebar>
            <MainContent></MainContent>
        </div>
    )
}
