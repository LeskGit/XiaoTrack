import CategorySidebar from "./CategorySidebar"
import Menu from '@/assets/icons/menu.svg?react'

export default function MainSidebar() {

    return (
        <div className="flex flex-col gap-2 shadow-sm">
            <CategorySidebar title='Dashboard' icon={Menu}/>
            <CategorySidebar title='Planning' icon={Menu}/>
            <CategorySidebar title='Training' icon={Menu}/>
            <CategorySidebar title='Habits' icon={Menu}/>
        </div>
    )
}