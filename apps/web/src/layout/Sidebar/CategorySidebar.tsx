import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";

export default function CategorySidebar({icon: IconComponent, title, className} : SBCategoriePprops) {
    return (
        <div className={`flex justify-start items-center gap-5 px-4 py-4 mx-2 rounded hover:bg-gray-100 transition-colors duration-200 ${className ?? ""}`}>
            {<Icon icon={IconComponent} size="custom" className="w-7 h-7 text-gray-800" iconWeight="regular" />}
            <h2 className="font-medium text-gray-800">{title}</h2>
        </div>
    )
}