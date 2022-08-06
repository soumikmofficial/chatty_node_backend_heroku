import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../errors/errors";
import Chat from "../models/Chat";
import Message from "../models/Message";

export const sendMessage = async (req: Request, res: Response) => {
  const { content, chat } = req.body;
  if (!content || !chat) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `one or more fields are missing`
    );
  }

  const isChat = await Chat.findById(chat);
  if (!isChat) {
    throw new CustomAPIError(StatusCodes.BAD_REQUEST, `chat not found`);
  }

  //   ? checks if user is part of the chat
  const userAllowed = isChat.users.some(
    (user) => user.toString() === req.user.userId
  );
  if (!userAllowed) {
    throw new CustomAPIError(
      StatusCodes.BAD_REQUEST,
      `message not sent as user not part of the chat`
    );
  }

  let message = await Message.create({
    content,
    chat,
    sender: req.user.userId,
  });

  message = await message.populate([
    { path: "sender", select: "name email avatar" },
    { path: "chat", populate: { path: "users" } },
  ]);

  await Chat.findByIdAndUpdate(chat, { $set: { latestMessage: message._id } });
  res.status(StatusCodes.CREATED).json(message);
};

// todo: get all messages of a given chat
export const getMessagesByChatId = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new CustomAPIError(StatusCodes.BAD_REQUEST, `chat doesn't exist`);
  }

  const messages = await Message.find({ chat: chatId })
    .populate({ path: "sender", select: "name email avatar" })
    .populate({
      path: "chat",
      populate: { path: "users", select: "name email avatar" },
    });

  res.status(StatusCodes.OK).json(messages);
};
