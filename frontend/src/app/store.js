import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';
import taskDraftReducer from '../features/taskDraft/taskDraftSlice';
import { chatApi } from '../features/chat/chatApi';
import { taskDraftApi } from '../features/taskDraft/taskDraftApi';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    taskDraft: taskDraftReducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [taskDraftApi.reducerPath]: taskDraftApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware, taskDraftApi.middleware),
});

export default store;
