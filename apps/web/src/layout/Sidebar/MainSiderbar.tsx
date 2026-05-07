import SidebarCategory from "./SidebarCategory"
import Menu from '@/assets/icons/menu.svg?react'

export default function MainSidebar() {

    return (
        <div className="grid grid-cols-1">
            <SidebarCategory title='Categorie' icon={Menu} className=""/>
        </div>
    )
}