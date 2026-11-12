import { Icon } from "@/components/icons"
import RisingArrow from '@/assets/icons/rising-arrow.svg?react'

export default function AppHeader() {
    return (
        // Same glass panel as the sidebar below it: they read as one column
        <div className="group flex h-16 items-center gap-3 border-b border-line bg-glass px-4 backdrop-blur-xl md:border-r">
            {/*
              Tile: diagonal blue → violet gradient, a thin inner light edge (ring-inset),
              a light sheen on the top half (before:) and a coloured glow instead of a black shadow.
              On hover the arrow climbs a little.
            */}
            <span className="bg-brand relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-(--shadow-brand) ring-1 ring-white/25 ring-inset before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/25 before:to-transparent">
                <Icon
                    icon={RisingArrow}
                    size="custom"
                    iconWeight="bold"
                    className="relative h-6 w-6 text-white drop-shadow-[0_1px_1px_rgb(49_46_129/0.45)] transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
            </span>
            <span className="text-brand text-[1.375rem] leading-none font-semibold tracking-tight">
                XiaoTrack
            </span>
        </div>
    )
}
