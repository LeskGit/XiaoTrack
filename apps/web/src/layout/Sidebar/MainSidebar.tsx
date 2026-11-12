import CategorySidebar from "./CategorySidebar"
import { sidebarRoutes } from "@/shared/config/routes"

export default function MainSidebar() {

    return (
        // Glass panel, continuing the brand block above it
        <aside className="flex min-h-0 flex-col border-b border-line bg-glass px-3 pt-5 pb-3 backdrop-blur-xl md:overflow-y-auto md:border-r md:border-b-0">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold tracking-wider text-gray-400 uppercase">
                Menu
            </p>
            <nav aria-label="Main">
                <ul className="flex flex-col gap-1">
                    {sidebarRoutes.map((category) => <li key={category.id}><CategorySidebar icon={category.handle.icon} title={category.handle.title} path={category.path} /></li>)}
                </ul>
            </nav>
        </aside>
    )
}
