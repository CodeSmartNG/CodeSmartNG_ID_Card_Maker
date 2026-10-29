import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/* ---------- POST /auth/register ---------- */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  res
    .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
    .status(201)
    .json({ user, accessToken });
});

/* ---------- POST /auth/login ---------- */
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res
    .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
    .status(200)
    .json({ user, accessToken });
});

/* ---------- POST /auth/refresh ---------- */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const { user, accessToken, refreshToken } = await authService.refresh(token);

  res
    .cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions)
    .status(200)
    .json({ user, accessToken });
});

/* ---------- POST /auth/logout ---------- */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: 0 }).status(204).send();
});

/* ---------- POST /auth/logout-all ---------- */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: 0 }).status(204).send();
});

/* ---------- GET /auth/me ---------- */
export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.json({ user });
});
