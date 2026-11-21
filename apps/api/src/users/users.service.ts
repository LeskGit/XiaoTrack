import { Injectable } from "@nestjs/common";
import { User } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";


export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findById(id: string): Promise<PublicUser | null> {
        return this.prisma.user.findUnique({ 
            where: { id }, 
            omit: {passwordHash: true },
        });
    }

    findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email }});
    }

    create(email: string, displayName: string, passwordHash: string): Promise<PublicUser | null> {
        return this.prisma.user.create({
            data: { email, displayName, passwordHash },
            omit: { passwordHash: true },
        })
    }
}