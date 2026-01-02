import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || '/api';

export const taskDraftApi = createApi({
  reducerPath: 'taskDraftApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['TaskDraft'],
  endpoints: (builder) => ({
    getTaskDraft: builder.query({
      query: (owner) => ({
        url: `/task-drafts/${owner}`,
        method: 'GET',
      }),
      providesTags: (result, error, owner) => (result && owner ? [{ type: 'TaskDraft', id: owner }] : []),
    }),
    saveTaskDraft: builder.mutation({
      query: ({ owner, task }) => ({
        url: '/task-drafts',
        method: 'POST',
        body: { owner, task },
      }),
      invalidatesTags: (result, error, arg) => (arg ? [{ type: 'TaskDraft', id: arg.owner }] : []),
    }),
  }),
});

export const { useGetTaskDraftQuery, useSaveTaskDraftMutation } = taskDraftApi;
