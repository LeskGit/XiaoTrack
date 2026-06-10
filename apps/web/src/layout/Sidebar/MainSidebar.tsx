import CategorySidebar from "./CategorySidebar"
import { sidebarRoutes } from "@/shared/config/routes"

export default function MainSidebar() {

    return (
        <div className="flex flex-col shadow-sm pt-6 pb-2">
            <ul>
                {sidebarRoutes.map((category) => <li key={category.id}><CategorySidebar icon={category.metadata.icon} title={category.metadata.title} path={category.path} /></li>)}
            </ul>
        </div>
    )
}