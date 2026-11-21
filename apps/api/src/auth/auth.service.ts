import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PublicUser, UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService,
    ) {}

    async register({ email, displayName, password }: RegisterDto): Promise<PublicUser | null> {
        const passwordhash = await hash(password);
        try {
            return await this.users.create(email, displayName, passwordhash);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Email is already in use');
            }
            throw error;
        }
    }

    async login({ email, password }: LoginDto) {
        const user = await this.users.findByEmail(email);
        const isValidPassword = user ? await verify(user.passwordHash, password) : false;

        if (!user || !isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = { sub: user.id, role: user.role };
        const accessToken = await this.jwt.signAsync(payload);

        return {
            user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
            accessToken,
        };
    }

    async me(userId: string): Promise<PublicUser> {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
