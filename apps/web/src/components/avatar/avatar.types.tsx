import type { BaseImgProps } from '@/shared/types'

export type AvatarProps = BaseImgProps & {
    src?: string;
    classNameContainer?: string;
}