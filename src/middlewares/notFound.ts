import { Response, Request } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: "failed",
    message: "the page you requested for does not exist",
  });
};
