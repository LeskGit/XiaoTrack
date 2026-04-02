
import type { BaseIconPropsSvg } from "@/components/icons/icons.types"

export default function IconBase({
        xmlns = "http://www.w3.org/2000/svg",
        fill = "none",
        viewBox = "0 0 24 24",
        strokeWidth = 1.5,
        className = "w-6 h-6",
        strokeLinecap = "round",
        strokeLinejoin = "round",
        stroke = "black",
        d }: BaseIconPropsSvg) {

    return (
        <svg xmlns={xmlns} fill={fill} viewBox={viewBox} strokeWidth={strokeWidth} stroke={stroke} className={className ?? ""}>
            <path strokeLinecap= {strokeLinecap} strokeLinejoin={strokeLinejoin} d={d} />
        </svg>
    )
}