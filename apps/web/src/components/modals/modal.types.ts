import type { ReactNode } from "react";

export type ModalProps = {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly title?: string;
    readonly children?: ReactNode;
    readonly placement?: ModalPlacement;
    readonly size?: ModalSize;
    readonly classname?: string;
    readonly closeOnBackdropClick?: boolean;
}

export const ModalPlacement = {
    Center: "center",
    Right: "right",
} as const;
export type ModalPlacement = typeof ModalPlacement[keyof typeof ModalPlacement];

export const ModalSize = {
    Small: "sm",
    Medium: "md",
    Large: "lg",
    Custom: "custom",
} as const;
export type ModalSize = typeof ModalSize[keyof typeof ModalSize];

export const placementClasses = {
    center: "m-auto rounded-xl",
    right: "ml-auto mr-0 my-0 h-full max-h-none rounded-none",
} as const satisfies Record<ModalPlacement, string>;

export const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-2xl",
    custom: "",
} as const satisfies Record<ModalSize, string>;