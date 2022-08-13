import express from "express";
import "express-async-errors";
// import morgan from "morgan";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

// ...................................
import { config } from "./config/config";
import { notFound } from "./middlewares/notFound";
import errorHandlerMiddleware from "./middlewares/errorHandler";
import { connectDB } from "./db/connect";

// ..................routes...............
import chatRouter from "./routes/chatRoutes";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import messageRouter from "./routes/messageRoutes";

const app = express();

// ............cloudinary.................
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.ORIGIN as string,
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// app.use(morgan("tiny"));

// .....................routes...................
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);

app.use(errorHandlerMiddleware);
app.use(notFound);

const server = http.createServer(app);

const startServer = async () => {
  await connectDB();
  server.listen(config.server.port, () =>
    console.log(`server running on port ${config.server.port}`)
  );
};

startServer();

// .............socket.io...............
interface IOnlineUser {
  socketId: string;
  userId: string;
}

console.log(process.env.ORIGIN);

import { Server } from "socket.io";
import { IUser } from "./types";
import chalk from "chalk";
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
  },
});

let onlineUsers: IOnlineUser[] = [];

const addUser = (userData: IOnlineUser) => {
  const isExisting = onlineUsers.some(
    (user) => user.userId === userData.userId
  );

  if (isExisting) return;
  onlineUsers.push(userData);
};

const removeUser = (socketId: string) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  return;
};

io.on("connection", (socket) => {
  socket.on("connected", (user) => {
    console.log(`${socket.id} connected`);
    addUser({ socketId: socket.id, userId: user.userId });
    io.emit("userOnline", onlineUsers);
  });

  socket.on("create-room", (chat) => {
    socket.join(chat);
  });

  socket.on("leave-room", (chat) => {
    socket.leave(chat);
    console.log(`left ${chat}`);
  });

  socket.on("new-message", (newMessage) => {
    socket.broadcast
      .to(newMessage.chat._id)
      .emit("receive-message", newMessage);

    const users = newMessage.chat.users;
    users.forEach((user: IUser) => {
      const isOnline = onlineUsers.find((u) => u.userId === user._id);
      if (isOnline && isOnline.socketId !== socket.id) {
        io.to(isOnline.socketId).emit("refetch chats");
      }
    });
  });

  // the notification
  socket.on("notify", (message) => {
    socket.broadcast.emit("notification", message);
  });

  //  group activity
  socket.on("removed from group", ({ userId, chat }) => {
    const user = onlineUsers.find((u) => u.userId === userId);
    if (!user) return;
    io.to(user.socketId).emit("removed", { chat });
  });

  socket.on("added to group", ({ users, chat }) => {
    console.log(chalk.yellow("group was createds"));
    users.forEach((user: string) => {
      const online = onlineUsers.find((u) => u.userId === user);
      if (online) {
        io.to(online.socketId).emit("added", { chat });
      }
    });
  });

  socket.on("chat deleted", (chat) => {
    const receipients = chat.users.filter(
      (user: IUser) => user._id !== chat.groupAdmin
    );
    receipients.forEach((person: IUser) => {
      let online = onlineUsers.find((user) => user.userId === person._id);
      if (online) {
        io.to(online.socketId).emit("chat deleted", chat);
      }
    });
  });

  socket.on("updated chat name", (users) => {
    console.log(chalk.yellow("name updated"));
    users.forEach((person: IUser) => {
      let online = onlineUsers.find((user) => user.userId === person._id);
      if (online) {
        io.to(online.socketId).emit("updated chat name");
      }
    });
  });

  // the tping indicator
  socket.on("typing", ({ chat, avatar }) => {
    socket.broadcast.to(chat).emit("typing", avatar);
  });
  socket.on("idle", (chat) => {
    socket.broadcast.to(chat).emit("idle");
  });

  socket.on("logout", () => {
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
    removeUser(socket.id);
    io.emit("userOnline", onlineUsers);
  });
});
