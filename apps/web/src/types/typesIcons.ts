/**
 * Handle all type for Icon components 
 */
 
export type BaseIconPropsSvg = {
    xmlns?: string;
    fill?: string;
    classNameBase?: string;
    viewBox?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: "round" | "butt" | "square" | "inherit"; 
    strokeLinejoin?: "round" | "bevel" | "miter" | "inherit"; 
    d: string;
}

export type BaseIconPropsImg = {
    classNameBase?: string;
    size?: "sm" | "md" | "lg";
    color?: "default" | "primary" | "accent";
    src: string;
}

export type IconButtonPropsSvg = BaseIconPropsSvg & {
    classNameButton?: string;
    onClick?: () => void; 
}