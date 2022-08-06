import { authenticateUser } from "./../middlewares/authentication";
import { Router } from "express";
import {
  addUserToGroup,
  createGroupChat,
  deleteGroupChat,
  fetchChatsByUserId,
  getOrCreateChat,
  getSingleChat,
  removeUserFromGroup,
  renameGroupChat,
} from "../controllers/chatController";

const router = Router();

router.route("/").get(authenticateUser, fetchChatsByUserId);
router.route("/:chatId").get(getSingleChat);
router.route("/").post(authenticateUser, getOrCreateChat);
router.route("/group").post(authenticateUser, createGroupChat);
router.route("/group").patch(authenticateUser, renameGroupChat);
router.route("/group").delete(authenticateUser, deleteGroupChat);
router.route("/group/add").patch(authenticateUser, addUserToGroup);
router.route("/group/remove").patch(authenticateUser, removeUserFromGroup);

export default router;
