import { Icon } from "@/components/icons"
import RisingArrow from '@/assets/icons/rising-arrow.svg?react'

/*
  Logo tile: one of the two places allowed to use the brand gradient (charter §3).
  A thin inner light edge (ring-inset), a sheen on the top half (before:) and a coloured glow.
*/
const logoTileClasses = [
    "bg-brand relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md",
    "shadow-brand ring-1 ring-white/25 ring-inset",
    "before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/25 before:to-transparent",
].join(" ");

// On hover of the whole block, the arrow climbs a little
const logoArrowClasses = "relative h-6 w-6 text-white transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

export default function AppHeader() {
    return (
        // Same plain panel as the sidebar below it: they read as one column
        <div className="group flex h-16 items-center gap-3 border-b border-line bg-surface px-4 md:border-r">
            <span className={logoTileClasses}>
                <Icon icon={RisingArrow} size="custom" iconWeight="bold" className={logoArrowClasses} />
            </span>
            <span className="text-brand text-heading font-semibold">
                XiaoTrack
            </span>
        </div>
    )
}
