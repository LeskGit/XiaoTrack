/**
 * Types/props of Main Layouts
 */

import { Icon } from "@/components/icons";

export type MainheaderProps = {
    readonly categorieName: string;
    readonly date: Date;
}


export type SBCategoriePprops = {
    readonly title?: string;
    readonly icon: typeof Icon;
    readonly className?: string;
}