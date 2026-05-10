import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";

export default function CategorySidebar({icon: IconComponent, title} : SBCategoriePprops) {
    return (
        <div className="flex justify-start items-center gap-5 px-3 py-2 shadow rounded-md">
            {<Icon icon={IconComponent} size="custom" className="w-8 h-8" />}
            <h2 className="font-medium">{title}</h2>
        </div>
    )
}