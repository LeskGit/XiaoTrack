
export const sizeMapTW = {
    "sm": "w-5 h-5",
    "md": "w-10 h-10",
    "lg": "w-15 h-15",
    "custom": ""
} as const;

export type SizeKey = keyof typeof sizeMapTW;

export const iconWeightMap = {
    "none": "[&>svg]:stroke-0",
    "thin": "[&>svg]:stroke-1",
    "regular": "[&>svg]:stroke-[1.5]",
    "bold": "[&>svg]:stroke-2",
    "custom": ""
} as const;

export type IconWeightKey = keyof typeof iconWeightMap;