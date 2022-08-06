import mongoose, { Schema, Document } from "mongoose";

interface IToken {
  refreshToken: string;
  userAgent: string;
  ip: string;
  isValid: boolean;
}
interface ITokenModel extends IToken, Document {}

const TokenSchema = new Schema<ITokenModel>(
  {
    refreshToken: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITokenModel>("Token", TokenSchema);
