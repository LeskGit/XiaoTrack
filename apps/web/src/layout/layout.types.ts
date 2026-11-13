/**
 * Types/props of Main Layouts
 */

export type SBCategoriePprops = {
    readonly title: string;
    readonly icon: React.ComponentType;
    readonly path: string;
    // CSS colour of the entry's domain, for its icon tile (see domainToneMap)
    readonly tone: string;
}