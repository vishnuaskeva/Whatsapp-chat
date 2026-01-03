import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["message", "task", "upload"],
      default: "message",
    },
    title: String,
    body: String,
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", NotificationSchema);
