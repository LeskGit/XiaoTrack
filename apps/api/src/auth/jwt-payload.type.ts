import type { Role } from "../generated/prisma/client";


export type JwtPayload = { sub: string, role: Role };