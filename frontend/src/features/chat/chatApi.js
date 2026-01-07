import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBaseUrl } from "../../utils/apiConfig";

const baseUrl = getApiBaseUrl();
const buildConvId = (a, b) => [a, b].sort().join("::");

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ["Messages"],
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: ({ participant1, participant2 }) => ({
        url: "/messages",
        params: { participant1, participant2 },
      }),
      transformResponse: (response) => {
        return response;
      },
      providesTags: (result, error, arg) => [
        {
          type: "Messages",
          id: buildConvId(arg.participant1, arg.participant2),
        },
      ],
    }),
    getPersonalNotes: builder.query({
      query: (username) => ({
        url: `/messages/notes/${username}`,
      }),
      providesTags: (result, error, username) => [
        { type: "Messages", id: username },
      ],
    }),
    sendMessage: builder.mutation({
      query: (payload) => ({
        url: "/messages",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Messages", id: buildConvId(arg.sender, arg.recipient) },
      ],
    }),
    savePersonalNote: builder.mutation({
      query: ({ username, content }) => ({
        url: "/messages/notes",
        method: "POST",
        body: { username, content },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Messages", id: arg.username },
      ],
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: "/uploads",
        method: "POST",
        body: formData,
      }),
    }),
    editMessage: builder.mutation({
      query: ({ messageId, content, sender }) => ({
        url: `/messages/${messageId}/edit`,
        method: "PUT",
        body: { content, sender, messageId },
      }),
      invalidatesTags: (result, error, arg) => [
        "Messages",
      ],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useGetPersonalNotesQuery,
  useSendMessageMutation,
  useSavePersonalNoteMutation,
  useUploadFileMutation,
  useEditMessageMutation,
} = chatApi;

export default chatApi;
