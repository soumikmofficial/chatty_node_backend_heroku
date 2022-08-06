import CustomAPIError from "../errors/errors";
import Token from "../models/Token";
import { isTokenValid } from "../utils/jwt";
import { attachCookiesToResponse } from "../utils/jwt";
import { Request, Response, NextFunction } from "express";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken, refreshToken } = req.signedCookies;
  try {
    //? access token?
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }
    //? only refreshToken?
    const payload = isTokenValid(refreshToken);
    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken,
    });
    //? no token or !isValid?
    if (!existingToken || !existingToken.isValid)
      throw new CustomAPIError(401, `authentication failed`);
    //? attach cookies to response and set req.user...next middleware
    attachCookiesToResponse({ res, user: payload.user, refreshToken });
    req.user = payload.user;
    next();
  } catch (error) {
    throw new CustomAPIError(401, `authentication failed... try logging in`);
  }
};

export const authorizePermissions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomAPIError(403, `Not authorized to access this route`);
    }
    next();
  };
};
