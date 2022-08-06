import mongoose, { model, Schema, Document, Types } from "mongoose";

interface IMessageSchema {
  sender: Types.ObjectId;
  content: string;
  chat: Types.ObjectId;
}

interface IMessageModel extends IMessageSchema, Document {}

const messageSchema = new Schema<IMessageModel>(
  {
    sender: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      required: true,
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IMessageModel>("Message", messageSchema);
