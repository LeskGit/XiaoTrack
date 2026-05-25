import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";
import { NavLink } from "react-router-dom";

export default function CategorySidebar({icon: IconComponent, title, path} : SBCategoriePprops) {
    return (
        <NavLink to={path} className={({isActive}) =>
            `flex justify-start items-center gap-5 px-4 py-3 mx-2 my-2 rounded-xl text-gray-800 transition-colors duration-200
            ${isActive ? "bg-sky-100 text-sky-700" : "hover:bg-gray-100"}`}
        >
            <Icon icon={IconComponent} size="custom" className="w-7 h-7" iconWeight="regular" />
            <span className="font-medium">{title}</span>
        </NavLink>
    )
}