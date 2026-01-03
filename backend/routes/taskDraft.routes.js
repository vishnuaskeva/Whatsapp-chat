import express from "express";
import {
  getTaskDraftByOwner,
  upsertTaskDraft,
} from "../controllers/taskDraft.controller.js";

const router = express.Router();

router.get("/:owner", getTaskDraftByOwner);
router.post("/", upsertTaskDraft);

export default router;
