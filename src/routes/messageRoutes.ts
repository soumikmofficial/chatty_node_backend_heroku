import { getMessagesByChatId } from "./../controllers/messageController";
import { authenticateUser } from "./../middlewares/authentication";
import { Router } from "express";
import { sendMessage } from "../controllers/messageController";

const router = Router();

router.route("/").post(authenticateUser, sendMessage);
router.route("/:chatId").get(authenticateUser, getMessagesByChatId);

export default router;
