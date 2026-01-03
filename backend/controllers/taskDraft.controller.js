import TaskDraft from "../models/TaskDraft.model.js";

export const getTaskDraftByOwner = async (req, res) => {
  try {
    const { owner } = req.params;

    if (!owner) {
      return res.status(400).json({ error: "Owner is required" });
    }

    const draft = await TaskDraft.findOne({ owner });

    if (!draft) {
      return res.status(200).json({ owner, task: null });
    }

    return res.status(200).json(draft);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch task draft", message: error.message });
  }
};

export const upsertTaskDraft = async (req, res) => {
  try {
    const { owner, task } = req.body;

    if (!owner || !task) {
      return res.status(400).json({ error: "owner and task are required" });
    }

    const updatedDraft = await TaskDraft.findOneAndUpdate(
      { owner },
      { owner, task },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(updatedDraft);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to save task draft", message: error.message });
  }
};
