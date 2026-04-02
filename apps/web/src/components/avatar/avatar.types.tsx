import type { BaseImgProps } from '@/shared/types'

export type AvatarProps = BaseImgProps & {
    src?: string;
    size?: string;
    classNameContainer?: string;
}