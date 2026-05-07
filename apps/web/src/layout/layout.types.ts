/**
 * Types/props of Main Layouts
 */

export type MainheaderProps = {
    readonly categorieName: string;
    readonly date: Date;
}


export type SBCategoriePprops = {
    readonly title?: string;
    readonly icon: React.ComponentType;
    readonly className?: string;
}