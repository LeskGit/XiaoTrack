import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// @nestjs/jwt ships as ESM only: Jest (CommonJS) cannot load it. The real signing is not under test here
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));

// The generated Prisma client is ESM-only (import.meta): Jest (CommonJS) cannot load it.
// AuthService only needs the error class, so we provide a stand-in with the same shape.
jest.mock('../generated/prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.code = code;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});
// UsersService reaches the database through PrismaService: never loaded, replaced by a mock below
jest.mock('../users/users.service', () => ({ UsersService: jest.fn() }));

type KnownRequestErrorClass = new (
  message: string,
  meta: { code: string },
) => Error;

// Loaded after jest.mock, so we get the stand-in class
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Prisma } = require('../generated/prisma/client') as {
  Prisma: { PrismaClientKnownRequestError: KnownRequestErrorClass };
};

const publicUser = {
  id: 'user-1',
  email: 'axel@example.test',
  displayName: 'Axel',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let users: { create: jest.Mock; findByEmail: jest.Mock; findById: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = { create: jest.fn(), findByEmail: jest.fn(), findById: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('stores a hash, never the password, and returns the public user', async () => {
      users.create.mockResolvedValue(publicUser);

      const result = await service.register({
        email: 'axel@example.test',
        displayName: 'Axel',
        password: 'super-secret',
      });

      expect(result).toBe(publicUser);
      const [email, displayName, passwordHash] = users.create.mock.calls[0] as [
        string,
        string,
        string,
      ];
      expect(email).toBe('axel@example.test');
      expect(displayName).toBe('Axel');
      expect(passwordHash).not.toBe('super-secret');
      expect(passwordHash).toMatch(/^\$argon2/);
    });

    it('turns a unique-constraint violation (P2002) into a 409', async () => {
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002' }),
      );

      await expect(
        service.register({
          email: 'taken@example.test',
          displayName: 'Axel',
          password: 'super-secret',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets any other database error through', async () => {
      const failure = new Error('database down');
      users.create.mockRejectedValue(failure);

      await expect(
        service.register({
          email: 'axel@example.test',
          displayName: 'Axel',
          password: 'super-secret',
        }),
      ).rejects.toBe(failure);
    });
  });

  describe('login', () => {
    it('returns the user without the hash, and a token carrying id and role', async () => {
      users.findByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash: await hash('super-secret'),
      });

      const result = await service.login({
        email: 'axel@example.test',
        password: 'super-secret',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'axel@example.test',
        displayName: 'Axel',
        role: 'USER',
      });
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        role: 'USER',
      });
    });

    it('rejects a wrong password with a 401', async () => {
      users.findByEmail.mockResolvedValue({
        ...publicUser,
        passwordHash: await hash('super-secret'),
      });

      await expect(
        service.login({
          email: 'axel@example.test',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an unknown email with the same 401 (no hint that the account exists)', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.test', password: 'whatever1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns the user of the token', async () => {
      users.findById.mockResolvedValue(publicUser);

      await expect(service.me('user-1')).resolves.toBe(publicUser);
    });

    it('rejects with a 401 when the user no longer exists', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.me('deleted-user')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
