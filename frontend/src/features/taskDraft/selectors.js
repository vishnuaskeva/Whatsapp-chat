export const selectTaskDraftState = (state) => state.taskDraft;
export const selectTaskDraft = (state) => state.taskDraft.task;
export const selectActiveScreenId = (state) => state.taskDraft.activeScreenId;
export const selectPreviewMode = (state) => state.taskDraft.previewMode;

export const selectActiveScreen = (state) => {
  const { task, activeScreenId } = state.taskDraft;
  return task.screens.find((s) => s.id === activeScreenId) || null;
};
