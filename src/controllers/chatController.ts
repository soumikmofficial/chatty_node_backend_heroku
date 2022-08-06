import { group } from "console";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../errors/errors";
import Chat from "../models/Chat";
import User from "../models/User";

// todo: all chats
export const getAllChats = async (req: Request, res: Response) => {
  const chats = await Chat.find({}).populate("users");
  res.status(StatusCodes.OK).json(chats);
};

// todo: single chat by id
export const getSingleChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId).populate({
    path: "users",
    select: " name email avatar",
  });
  if (!chat)
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `chat with id: ${chatId} doesn't exist`
    );

  res.status(StatusCodes.OK).json(chat);
};

// todo: get chat or create chat
export const getOrCreateChat = async (req: Request, res: Response) => {
  if (!req.body.userId)
    throw new CustomAPIError(StatusCodes.BAD_REQUEST, `userId missing`);

  const user = await User.findById(req.body.userId);
  if (!user)
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `no user found with id: ${req.body.userId}`
    );

  const existingChat = await Chat.findOne({
    chatType: "single",
    $and: [
      { users: { $elemMatch: { $eq: req.body.userId } } },
      { users: { $elemMatch: { $eq: req.user.userId } } },
    ],
  })
    .populate({ path: "users", select: "name email avatar" })
    .populate("latestMessage");

  if (existingChat) {
    return res.status(StatusCodes.OK).json(existingChat);
  }
  const chat = await Chat.create({
    users: [req.user.userId, req.body.userId],
  });
  const newChat = await Chat.find({ _id: chat._id })
    .populate({ path: "users", select: "name email avatar" })
    .populate("latestMessage");

  res.status(StatusCodes.OK).json(newChat);
};

// todo: fetch all chat of the logged in user
export const fetchChatsByUserId = async (req: Request, res: Response) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user.userId } },
  })
    .populate({ path: "users", select: "name email avatar" })
    .populate("latestMessage")
    .populate({ path: "groupAdmin", select: "name email avatar" })
    .sort({ updatedAt: -1 });
  res.status(StatusCodes.OK).json(chats);
};

// todo: create group chat
export const createGroupChat = async (req: Request, res: Response) => {
  if (!req.body.users || req.body.users.length < 1)
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `group chat must include two or more participants... users are missing`
    );
  if (!req.body.chatName)
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `group name not provided`
    );

  let users = req.body.users;
  users.push(req.user.userId);
  const newChat = await Chat.create({
    chatType: "group",
    users,
    groupAdmin: req.user.userId,
    chatName: req.body.chatName,
  });
  const groupChat = await Chat.findById(newChat._id)
    .populate({ path: "users", select: "name email avatar" })
    .populate("latestMessage")
    .populate({ path: "groupAdmin", select: "name email avatar" });
  res.status(StatusCodes.CREATED).json(groupChat);
};

// todo: rename group chat
export const renameGroupChat = async (req: Request, res: Response) => {
  const { chatName, groupId } = req.body;

  if (!chatName)
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `new name for group is missing`
    );
  const groupChat = await Chat.findOneAndUpdate(
    { _id: groupId },
    { chatName },
    { new: true }
  );
  res.status(StatusCodes.OK).json(groupChat);
};

// todo: add user to group
export const addUserToGroup = async (req: Request, res: Response) => {
  const { groupId, userId } = req.body;
  // ? validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `user with id: ${userId} doesn't exist`
    );
  }
  // ? validate group
  const groupChat = await Chat.findOne({ _id: groupId, chatType: "group" });
  if (!groupChat) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `group with id: ${groupId} doesn't exist`
    );
  }

  if (groupChat.users.includes(userId)) {
    throw new CustomAPIError(StatusCodes.BAD_REQUEST, `user already in group`);
  }

  const chat = await Chat.findOneAndUpdate(
    { _id: groupId },
    { $push: { users: userId } },
    { new: true }
  )
    .populate({ path: "users", select: "name email avatar" })
    .populate({ path: "groupAdmin", select: "name email avatar" });
  res.status(StatusCodes.OK).json(chat);
};

// todo: remove user from group
export const removeUserFromGroup = async (req: Request, res: Response) => {
  const { groupId, userId } = req.body;
  // ? validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `user with id: ${userId} doesn't exist`
    );
  }
  // ? validate group
  const groupChat = await Chat.findOne({ _id: groupId, chatType: "group" });
  if (!groupChat) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `group with id: ${groupId} doesn't exist`
    );
  }

  if (
    groupChat.groupAdmin &&
    groupChat.groupAdmin.toString() === userId &&
    groupChat.users.length <= 1
  ) {
    await groupChat.remove();
    return res
      .status(StatusCodes.OK)
      .json({ message: "chat was deleted as all users left" });
  }
  if (
    groupChat.groupAdmin &&
    groupChat.groupAdmin.toString() === userId &&
    groupChat.users.length > 1
  ) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `admin cannot be removed from group when other users are present`
    );
  }

  if (
    userId !== req.user.userId &&
    req.user.userId !== groupChat.groupAdmin?.toString()
  ) {
    throw new CustomAPIError(
      StatusCodes.UNAUTHORIZED,
      `not authrozed to remove user from group`
    );
  }
  if (!groupChat.users.includes(userId)) {
    throw new CustomAPIError(StatusCodes.BAD_REQUEST, `user not in group`);
  }

  const chat = await Chat.findOneAndUpdate(
    { _id: groupId },
    { $pull: { users: userId } },
    { new: true }
  )
    .populate({ path: "users", select: "name email avatar" })
    .populate({ path: "groupAdmin", select: "name email avatar" });
  return res.status(StatusCodes.OK).json(chat);
};

export const deleteGroupChat = async (req: Request, res: Response) => {
  const { chatId } = req.body;

  const groupChat = await Chat.findById(chatId);
  if (!groupChat || !groupChat.groupAdmin) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `no group with the given id was found`
    );
  }
  if (groupChat.groupAdmin.toString() !== req.user.userId) {
    throw new CustomAPIError(
      StatusCodes.UNAUTHORIZED,
      `not authorized to delete group`
    );
  }

  await groupChat.remove();
  res.status(StatusCodes.OK).json(groupChat);
};
