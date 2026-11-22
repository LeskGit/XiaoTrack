import { Role } from '@/shared/api';

/**
 * What the UI shows for each API role (the API sends 'USER' / 'ADMIN').
 * `satisfies Record<Role, string>`: a new role without a label won't compile.
 */
export const roleLabel = {
    [Role.User]: 'Member',
    [Role.Admin]: 'Admin',
} as const satisfies Record<Role, string>;
