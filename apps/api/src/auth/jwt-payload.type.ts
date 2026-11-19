import type { Role } from "../generated/prisma/client";
import type { Request } from 'express';

export type JwtPayload = { sub: string, role: Role };
export type AuthenticatedRequest = Request & { user: JwtPayload};