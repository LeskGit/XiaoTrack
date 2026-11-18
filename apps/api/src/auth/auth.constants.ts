import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';

export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
};