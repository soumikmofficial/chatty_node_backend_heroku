import jwt from "jsonwebtoken";
import { Response } from "express";
import { JwtPayload } from "jsonwebtoken";

interface ITokenUser {
  userId: string;
  name: string;
  role: string;
}

interface IJwt {
  user: ITokenUser;
  refreshToken?: string;
}

interface ICookie {
  res: Response;
  user: ITokenUser;
  refreshToken: string;
}
interface IJwtReturn extends JwtPayload {
  user: ITokenUser;
}

export const createJWT = (payload: IJwt) =>
  jwt.sign(payload, process.env.JWT_SECRET as string);

export const isTokenValid = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET as string) as IJwtReturn;

export const attachCookiesToResponse = ({
  res,
  user,
  refreshToken,
}: ICookie) => {
  const accessTokenJWT = createJWT({ user });
  const refreshTokenJWT = createJWT({ user, refreshToken });

  const oneDay = 1000 * 60 * 60 * 24;
  const longerExpiry = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
    sameSite: 'none'
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + longerExpiry),
    sameSite: 'none'
  });
};
