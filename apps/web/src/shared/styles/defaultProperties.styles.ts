
export const sizeMapTW = {
    "sm": "w-5 h-5",
    "md": "w-10 h-10",
    "lg": "w-15 h-15",
    "custom": ""
} as const;

export type SizeKey = keyof typeof sizeMapTW;