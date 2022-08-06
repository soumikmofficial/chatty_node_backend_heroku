import express from "express";
import {
  registerUser,
  verifyEmail,
  login,
  removeUser,
  showCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import multer from "multer";
import { authenticateUser } from "../middlewares/authentication";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./tmp");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e4);
    cb(null, file.originalname.split(".")[0] + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(login);
router.route("/verify-email").post(verifyEmail);
router.route("/logout").delete(authenticateUser, logout);
router.route("/showMe").get(authenticateUser, showCurrentUser);
router.route("/remove").delete(removeUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

export default router;
