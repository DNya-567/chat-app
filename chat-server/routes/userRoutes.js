import express from "express";
import upload from "../middleware/upload.js";
import { updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.post(
  "/update-profile",
  upload.single("avatar"),
  updateProfile
);

export default router;
