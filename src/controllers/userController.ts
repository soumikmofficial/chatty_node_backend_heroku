import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../errors/errors";
import User from "../models/User";

// todo: all users / searched users but self
export const getAllUsers = async (req: Request, res: Response) => {
  let queryObj: any = { _id: { $ne: req.user.userId }, isVerified: true };
  const { search } = req.query;
  if (search) {
    queryObj.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const users = await User.find(queryObj).select("name email avatar");

  res.status(StatusCodes.OK).json(users);
};

// todo: get user profile
export const getProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const profile = await User.findById(userId).select("name email avatar");
  res.status(StatusCodes.OK).json(profile);
};
