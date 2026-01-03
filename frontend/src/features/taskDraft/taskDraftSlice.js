import { createSlice } from "@reduxjs/toolkit";
import initialTaskDraftState, {
  createEmptyScreen,
  createEmptyField,
} from "./initialState";

const taskDraftSlice = createSlice({
  name: "taskDraft",
  initialState: initialTaskDraftState,
  reducers: {
    openTaskDraft: (state) => {
      state.isOpen = true;
      if (state.task.screens.length === 0) {
        const screen = createEmptyScreen();
        state.task.screens.push(screen);
        state.activeScreenId = screen.id;
      }
    },
    closeTaskDraft: (state) => {
      state.isOpen = false;
    },
    resetTaskDraft: () => ({ ...initialTaskDraftState }),
    loadTaskDraft: (state, action) => {
      const { task } = action.payload || {};
      if (!task || !task.screens?.length) return;
      state.task = task;
      const hasActiveScreen = task.screens.some(
        (screen) => screen.id === state.activeScreenId
      );
      state.activeScreenId = hasActiveScreen
        ? state.activeScreenId
        : task.screens[0].id;
    },
    updateTaskTitle: (state, action) => {
      state.task.title = action.payload;
    },
    addScreen: (state) => {
      const screen = createEmptyScreen();
      state.task.screens.push(screen);
      state.activeScreenId = screen.id;
    },
    setActiveScreen: (state, action) => {
      state.activeScreenId = action.payload;
    },
    updateScreenTitle: (state, action) => {
      const { screenId, title } = action.payload;
      const screen = state.task.screens.find((s) => s.id === screenId);
      if (screen) screen.title = title;
    },
    addField: (state, action) => {
      const { screenId, type } = action.payload;
      const screen = state.task.screens.find((s) => s.id === screenId);
      if (screen) {
        screen.fields.push(createEmptyField(type));
      }
    },
    updateField: (state, action) => {
      const { screenId, fieldId, changes } = action.payload;
      const screen = state.task.screens.find((s) => s.id === screenId);
      if (!screen) return;
      const field = screen.fields.find((f) => f.id === fieldId);
      if (!field) return;
      Object.assign(field, changes);
    },
    removeField: (state, action) => {
      const { screenId, fieldId } = action.payload;
      const screen = state.task.screens.find((s) => s.id === screenId);
      if (!screen) return;
      screen.fields = screen.fields.filter((f) => f.id !== fieldId);
    },
    deleteScreen: (state, action) => {
      const screenId = action.payload;
      const screenIndex = state.task.screens.findIndex(
        (s) => s.id === screenId
      );
      if (screenIndex === -1) return;
      state.task.screens.splice(screenIndex, 1);
      // If deleted screen was active, switch to the first screen
      if (state.activeScreenId === screenId && state.task.screens.length > 0) {
        state.activeScreenId = state.task.screens[0].id;
      }
    },
  },
});

export const {
  openTaskDraft,
  closeTaskDraft,
  resetTaskDraft,
  updateTaskTitle,
  addScreen,
  setActiveScreen,
  updateScreenTitle,
  addField,
  updateField,
  removeField,
  deleteScreen,
  loadTaskDraft,
} = taskDraftSlice.actions;

export default taskDraftSlice.reducer;
