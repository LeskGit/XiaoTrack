/**
 * Types/props of Main Layouts
 */

import type { IconProps } from "@/components/icons";

export type MainheaderProps = {
    readonly categorieName: string;
    readonly date: Date;
}


export type SBCategoriePprops = {
    title?: string;
    logo: IconProps;
    className?: string;
}