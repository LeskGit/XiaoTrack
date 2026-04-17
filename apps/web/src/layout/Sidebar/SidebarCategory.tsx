import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";

export default function SidebarCategory({ logo, title, className} : SBCategoriePprops) {
    return (
        <div className={`flex justify-center items-center gap-3 ${className}`}>
            <Icon {...logo} />
            <h2 className="font-bold">{title}</h2>
        </div>
    )
}