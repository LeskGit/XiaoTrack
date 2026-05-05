import { Icon } from "@/components/icons"
import SidebarCategory from "./SidebarCategory"
import Menu from '@/assets/icons/menu.svg?react'

export default function MainSidebar() {

    const dashboardLogo = < Menu />;
    const dashBoardIcon = <Icon icon={dashboardLogo} size="md"  className="" />;

    return (
        <div className="grid grid-cols-1">
            <SidebarCategory title='Categorie' icon={dashBoardIcon} className=""/>
        </div>
    )
}