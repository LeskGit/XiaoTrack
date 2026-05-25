import CategorySidebar from "./CategorySidebar"
import { routes } from "@/shared/config/routes"

export default function MainSidebar() {

    return (
        <div className="flex flex-col shadow-sm pt-6 pb-2">
            <ul>
                {routes.map((category) => <li key={category.id}><CategorySidebar {...category} /></li>)}
            </ul>
        </div>
    )
}