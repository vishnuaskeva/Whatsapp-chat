import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "../features/chat/chatSlice";
import taskDraftReducer from "../features/taskDraft/taskDraftSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import { chatApi } from "../features/chat/chatApi";
import { taskDraftApi } from "../features/taskDraft/taskDraftApi";
import { notificationApi } from "../features/notifications/notificationApi";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    taskDraft: taskDraftReducer,
    notifications: notificationReducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [taskDraftApi.reducerPath]: taskDraftApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      chatApi.middleware,
      taskDraftApi.middleware,
      notificationApi.middleware
    ),
});

export default store;
