import { Icon } from "@/components/icons";
import type { SBCategoriePprops } from "../layout.types";
import { NavLink } from "react-router-dom";
import type { CSSProperties } from "react";

const linkBase = "group relative flex items-center gap-3 rounded-md px-2 py-1.5 text-body font-medium transition-[background-color,color,box-shadow] duration-200";
const linkActive = "bg-surface text-accent-strong shadow-card-hover";
const linkIdle = "text-ink-soft hover:bg-accent-soft hover:text-ink";

// Left indicator bar: flat accent, grows in when the entry becomes active
const indicatorBase = "absolute top-1/2 -left-3 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-[height,opacity] duration-300";

/*
  Icon tile tinted by the entry's domain (charter §2.5, tone-tile utility in index.css):
  soft at rest, filled with the domain colour when active.
*/
const tileBase = "tone-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200";
const tileActive = "bg-(--tone) text-white";

/**
 * One entry of the sidebar.
 * Active: white card with a soft shadow, an accent bar on the left edge, the icon tile filled with
 * the domain colour. Hover: a light accent wash.
 */
export default function CategorySidebar({icon: IconComponent, title, path, tone} : SBCategoriePprops) {
    return (
        <NavLink
            to={path}
            style={{ "--tone": tone } as CSSProperties}
            className={({isActive}) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
        >
            {({ isActive }) => (
                <>
                    <span aria-hidden="true" className={`${indicatorBase} ${isActive ? "h-6 opacity-100" : "h-0 opacity-0"}`} />
                    <span className={`${tileBase} ${isActive ? tileActive : ""}`}>
                        <Icon icon={IconComponent} size="custom" className="h-[18px] w-[18px]" iconWeight="regular" />
                    </span>
                    <span>{title}</span>
                </>
            )}
        </NavLink>
    )
}
