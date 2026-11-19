import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthenticatedRequest, JwtPayload } from "./jwt-payload.type";
import { ACCESS_TOKEN_COOKIE } from "./auth.constants";



@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];

        if (typeof token !== 'string' || token === '') {
            throw new UnauthorizedException();
        }

        try {
            request.user = await this.jwt.verifyAsync<JwtPayload>(token);
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }
}