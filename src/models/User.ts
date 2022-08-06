import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";

interface IResidence {
  city: string;
  country: string;
}

interface IUserInput {
  avatar: string;
  cloudinaryId: string;
  email: string;
  isVerified: boolean;
  password: string;
  passwordResetToken: string | null;
  passwordTokenExpirationDate: Date | null;
  role: string;
  name: string;
  verificationToken: string;
  verified: Date | undefined;
}

export interface IUserModel extends IUserInput, Document {
  matchPassword(userInput: string): Promise<boolean>;
}

const userSchema: Schema = new Schema<IUserModel>(
  {
    name: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: [15, "name too long. Try nickname"],
    },
    email: {
      requried: true,
      type: String,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide valid email",
      },
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "password cannot be than 6 characters"],
    },
    avatar: {
      type: String,
      default:
        "https://flyclipart.com/thumb2/user-profile-avatar-login-account-png-icon-free-download-935697.png",
    },

    cloudinaryId: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verified: Date,
    passwordResetToken: String,
    passwordTokenExpirationDate: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ? removes the avatar from cloudinary before removing the user from db
userSchema.pre("remove", async function () {
  await cloudinary.uploader.destroy(this.cloudinaryId);
});

userSchema.methods.matchPassword = async function (userInput: string) {
  const isMatch = await bcrypt.compare(userInput, this.password);
  return isMatch;
};

export default mongoose.model<IUserModel>("User", userSchema);
