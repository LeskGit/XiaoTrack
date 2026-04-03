import type { BaseImgProps } from '@/shared/types'
import type { SizeKey } from '@/shared/styles';

export type AvatarProps = BaseImgProps & {
    size?: SizeKey;
    className?: string;
}