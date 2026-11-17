import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PublicUser, UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly users: UsersService) {}

    async register({ email, password }: RegisterDto): Promise<PublicUser | null> {
        const passwordhash = await hash(password);
        try {
            return await this.users.create(email, passwordhash);
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

        return { id: user.id, email: user.email, role: user.role };
    }
}
