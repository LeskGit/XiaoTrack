import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";
import { NavLink } from "react-router-dom";

/**
 * One entry of the sidebar.
 * Active: white card with a soft indigo shadow, a brand-gradient bar on the left edge,
 * and the icon in a brand tile (same recipe as the logo). Hover: a light accent wash.
 */
export default function CategorySidebar({icon: IconComponent, title, path} : SBCategoriePprops) {
    return (
        <NavLink to={path} className={({isActive}) =>
            `group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200
            ${isActive
                ? "bg-surface text-accent-strong shadow-(--shadow-card-hover)"
                : "text-gray-600 hover:bg-accent-soft/70 hover:text-gray-900"}`}
        >
            {({ isActive }) => (
                <>
                    {/* Left indicator: grows in when the entry becomes active */}
                    <span
                        aria-hidden="true"
                        className={`bg-brand absolute top-1/2 -left-3 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300 ${isActive ? "h-6 opacity-100" : "h-0 opacity-0"}`}
                    />
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200
                        ${isActive
                            ? "bg-brand text-white shadow-(--shadow-brand) ring-1 ring-white/25 ring-inset"
                            : "bg-white/70 text-gray-500 ring-1 ring-line ring-inset group-hover:text-accent"}`}
                    >
                        <Icon icon={IconComponent} size="custom" className="h-5 w-5" iconWeight="regular" />
                    </span>
                    <span>{title}</span>
                </>
            )}
        </NavLink>
    )
}
