import CategorySidebar from "./CategorySidebar"
import { sidebarRoutes } from "@/shared/config/routes"
import { domainToneMap } from "@/shared/styles"

export default function MainSidebar() {

    return (
        // Plain panel, continuing the brand block above it
        <aside className="flex min-h-0 flex-col border-b border-line bg-surface px-3 pt-5 pb-3 md:overflow-y-auto md:border-r md:border-b-0">
            <p className="mb-2 px-2 text-caption font-semibold tracking-wider text-ink-muted uppercase">
                Menu
            </p>
            <nav aria-label="Main">
                <ul className="flex flex-col gap-1">
                    {sidebarRoutes.map((category) => (
                        <li key={category.id}>
                            <CategorySidebar
                                icon={category.handle.icon}
                                title={category.handle.title}
                                path={category.path}
                                tone={domainToneMap[category.path]}
                            />
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}
