import mongoose from 'mongoose';

const taskDraftSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    task: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const TaskDraft = mongoose.model('TaskDraft', taskDraftSchema);

export default TaskDraft;
