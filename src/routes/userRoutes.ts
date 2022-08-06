import express from "express";
import { getAllUsers, getProfile } from "../controllers/userController";
import { authenticateUser } from "../middlewares/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, getAllUsers);
router.route("/:userId").get(authenticateUser, getProfile);

export default router;
