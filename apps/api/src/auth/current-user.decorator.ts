import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './jwt-payload.type';

/**
 * The id of the logged-in user, read from the JWT that AuthGuard checked.
 * Only valid on a route protected by AuthGuard: without it, request.user does not exist.
 */
export const CurrentUserId = createParamDecorator(
    (_data: unknown, context: ExecutionContext): string => {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user.sub;
    },
);