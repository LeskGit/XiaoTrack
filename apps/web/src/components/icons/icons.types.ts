/**
 * Handle all type for Icon components 
 */

import type { SizeKey, IconWeightKey } from "@/shared/styles";


export type IconProps = {
    readonly icon: React.ComponentType;
    readonly className?: string;
    readonly size?: SizeKey;
    readonly iconWeight?: IconWeightKey;
}

export type IconButtonProps = IconProps & {
    readonly classNameBtn?: string;
    readonly onClick?: () => void; 
}