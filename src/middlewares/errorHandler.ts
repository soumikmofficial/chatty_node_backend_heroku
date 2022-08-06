import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";

interface IErr {
  statusCode: StatusCodes;
  message: string;
  [x: string]: any;
}
const errorHandlerMiddleware = (
  err: IErr,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong try again later",
  };

  if (err.name === "CastError") {
    customError.message = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  }

  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};

export default errorHandlerMiddleware;
