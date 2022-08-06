import { Response, Request } from "express";
import CustomAPIError from "../errors/errors";
import fs from "fs";
import crypto from "crypto";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import User from "../models/User";
import Token from "../models/Token";
import sendVerificationMail from "../utils/sendVerificationMail";
import { attachCookiesToResponse } from "../utils/jwt";
import createTokenUser from "../utils/createTokenUser";
import sendResetPasswordMail from "../utils/sendResetPasswordMail";
import createHash from "../utils/createHash";

// todo: register a user
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  // ? checks if all required input are there
  if (!name || !email || !password)
    throw new CustomAPIError(400, `one or more inputs are missing`);
  if (!req.file) {
    throw new CustomAPIError(400, `avatar is missing`);
  }

  // ? user alredy exists ?
  const isExistingEmail = await User.findOne({ email });
  if (isExistingEmail)
    throw new CustomAPIError(400, `Email already registered`);
  // ? admin or user?
  const isFirstUser = (await User.countDocuments({})) === 0;
  const role = isFirstUser ? "admin" : "user";
  // ? generate verification token
  const verificationToken = crypto.randomBytes(40).toString("hex");

  // ? upload image
  const uploadFile: UploadApiResponse = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "chatty-avatars",
      resource_type: "image",
    }
  );
  fs.unlinkSync(req.file.path);

  // ? send mail here
  await sendVerificationMail({
    name,
    email,
    verificationToken,
  });

  // ? create the User in db
  const user = new User({
    name,
    email,
    password,
    role,
    verificationToken,
    avatar: uploadFile.secure_url,
    cloudinaryId: uploadFile.public_id,
  });
  await user.save();

  res.status(201).json({
    status: "success",
    message: "Please check your inbox to verify your email",
  });
};

// todo: verify email after registering
export const verifyEmail = async (req: Request, res: Response) => {
  const { token, email } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new CustomAPIError(403, `Email couldn't be verified`);

  if (user.verificationToken !== token)
    throw new CustomAPIError(
      403,
      `Email couldn't be verified as token doesnt match`
    );
  user.isVerified = true;
  user.verificationToken = "";
  user.verified = new Date(Date.now());

  user.save();
  res
    .status(200)
    .json({ status: "success", message: "account verification successful" });
};

// todo: login
export const login = async (req: Request, res: Response) => {
  //? both email and password provided?
  const { email, password } = req.body;

  if (!email || !password)
    throw new CustomAPIError(400, `One or more fields are missing`);
  //? if user exists
  const user = await User.findOne({ email: email });
  if (!user) throw new CustomAPIError(401, `Invalid credentials`);
  //? is pssword correct?
  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new CustomAPIError(401, `Invalid credentials`);
  //? is user verified
  if (!user.isVerified)
    throw new CustomAPIError(401, `Couldn't authenticate user`);
  // ? create token user
  const tokenUser = createTokenUser(user);
  //? if token exists and is valid attach same token to cookies
  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });
  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) throw new CustomAPIError(401, `Authentication failed`);
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(200).json(tokenUser);
    return;
  }
  //? if no existing token, create new token and attach cookies to res
  refreshToken = crypto.randomBytes(10).toString("hex");
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const tokenToCreate = { ip, userAgent, refreshToken };
  await Token.create(tokenToCreate);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(200).json(tokenUser);
};

// todo: logout
export const logout = async (req: Request, res: Response) => {
  await Token.findOneAndDelete({ user: req.user.userId });
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res
    .status(200)
    .json({ status: "success", message: "logged out successfully" });
};

// todo: remove user (if need be)
export const removeUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.body.id);
  if (!user) throw new CustomAPIError(400, `couldn't find user`);
  await user.remove();
  res.status(200).json({ status: "success" });
};

// todo: current user
export const showCurrentUser = async (req: Request, res: Response) => {
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId }).select("-password");
  if (!user) throw new CustomAPIError(400, "user not found");
  const details = {
    name: user.name,
    role: user.role,
    userId: user._id,
  };
  return res.status(200).json({ user: details });
};

// todo: forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  //? email provided?
  const { email } = req.body;
  if (!email) throw new CustomAPIError(401, `Please provide your email id`);
  //? if user exists, create password hashed token
  const user = await User.findOne({ email });
  if (user) {
    const passwordResetToken = crypto.randomBytes(40).toString("hex");
    //? send reset mail with password token
    await sendResetPasswordMail({
      email,
      passwordResetToken,
      name: user.name,
    });
    //? update user with an password expiration date
    const tenMinutes = 1000 * 60 * 1000;
    user.passwordResetToken = createHash(passwordResetToken);
    user.passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
    await user.save();
  }
  //? send response
  res.status(200).json({
    status: "success",
    message: "Please check your email inbox ",
  });
};

// todo: reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password)
    throw new CustomAPIError(401, `password couldn't be reset`);
  const user = await User.findOne({ email });

  if (user) {
    const currentDate = new Date();
    if (
      user.passwordResetToken === createHash(token) &&
      user.passwordTokenExpirationDate &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordResetToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }
  res.status(201).json({
    status: "success",
    message: "password has been reset successfully",
  });
};
