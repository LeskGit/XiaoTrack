/**
 * Handle all type for Icon components 
 */
 
export type BaseIconPropsSvg = {
    xmlns?: string;
    fill?: string;
    className?: string;
    viewBox?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: "round" | "butt" | "square" | "inherit"; 
    strokeLinejoin?: "round" | "bevel" | "miter" | "inherit"; 
    d: string;
}

export type IconButtonPropsSvg = BaseIconPropsSvg & {
    classNameButton?: string;
    onClick?: () => void; 
}