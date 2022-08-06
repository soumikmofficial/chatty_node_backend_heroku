import { config } from "../config/config";
import mongoose from "mongoose";
import Logging from "../library/Logging";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo.url, {
      retryWrites: true,
      w: "majority",
    });
    const connection = mongoose.connection;
    if (connection.readyState >= 1) {
      Logging.info("connected to database");
      return;
    }
    connection.on("error", () => {
      Logging.error("connection failed");
    });
  } catch (error) {
    Logging.error(error);
  }
};
