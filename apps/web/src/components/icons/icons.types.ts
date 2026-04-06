/**
 * Handle all type for Icon components 
 */

import type { SizeKey } from "@/shared/styles";

export type BaseIconPropsSvg = {
    readonly xmlns?: string;
    readonly fill?: string;
    readonly classNameSvg?: string;
    readonly viewBox?: string;
    readonly stroke?: string;
    readonly strokeWidth?: number;
    readonly strokeLinecap?: "round" | "butt" | "square" | "inherit"; 
    readonly strokeLinejoin?: "round" | "bevel" | "miter" | "inherit"; 
    readonly preserveAspectRatio?: string;
    readonly d: string;
}

export type IconProps = BaseIconPropsSvg & {
    readonly className?: string;
    readonly size?: SizeKey;
}

export type IconButtonPropsSvg = BaseIconPropsSvg & {
    readonly className?: string;
    readonly size?: SizeKey;
    readonly onClick?: () => void; 
}