
import type { BaseIconPropsSvg } from "../../../types/typesIcons"

export default function IconBase({
        xmlns = "http://www.w3.org/2000/svg",
        fill = "none",
        viewBox = "0 0 24 24",
        strokeWidth = 1.5,
        classNameBase = "w-6 h-6",
        strokeLinecap = "round",
        strokeLinejoin = "round",
        stroke = "black",
        d }: BaseIconPropsSvg) {

    return (
        <svg xmlns={xmlns} fill={fill} viewBox={viewBox} strokeWidth={strokeWidth} stroke={stroke} className={classNameBase ?? ""}>
            <path strokeLinecap= {strokeLinecap} strokeLinejoin={strokeLinejoin} d={d} />
        </svg>
    )
}