import express from "express";
import { ITokenUser } from "./types";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
