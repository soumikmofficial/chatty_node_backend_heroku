export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface IMessage {
  _id: string;
  sender: IUser;
  content: string;
  chat: IChat;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface IChat {
  _id: string;
  chatName?: string;
  chatType: "single" | "group";
  users: IUser[];
  createdAt: Date;
  updatedAt: Date;
  groupAdmin?: string;
  latestMessage?: IMessage;
  __v: number;
}
