import { NextFunction, Request, Response } from 'express';

import { refreshCookieOptions } from '../config/cookie.config.js';
import { loginUserSchema, registerUserSchema } from '../schema/auth.schema.js';
import { AuthService } from '../service/auth.service.js';
import { AppError } from '../utils/app-error.util.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = registerUserSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid registeration data',
          errors: validation.error.issues,
        });
        return;
      }

      const result = await this.authService.registerUser(validation.data);

      res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          workspace: result.workspace,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = loginUserSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid login data',
          errors: validation.error.issues,
        });
        return;
      }

      const result = await this.authService.loginUser(validation.data);

      res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      res.clearCookie('refreshToken', {
        ...refreshCookieOptions,
        maxAge: undefined,
      });
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError('Refresh token is required', 401);
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
      res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          userId: req.user?.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
