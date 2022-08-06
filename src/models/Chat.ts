import mongoose, { model, Schema, Document, Types } from "mongoose";

interface IChatSchema {
  chatName: string;
  chatType: "single" | "group";
  users: Types.ObjectId[];
  latestMessage?: string;
  groupAdmin?: Types.ObjectId;
}

interface IChatModel extends IChatSchema, Document {}

const chatSchema = new Schema<IChatModel>(
  {
    chatName: { type: String, trim: true },
    chatType: {
      type: String,
      default: "single",
    },
    users: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default model<IChatModel>("Chat", chatSchema);
