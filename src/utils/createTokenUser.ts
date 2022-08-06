import { IUserModel } from "../models/User";

const createTokenUser = (user: IUserModel) => {
  const tokenUser = {
    userId: user._id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  };
  return tokenUser;
};

export default createTokenUser;
