import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBaseUrl } from "../../utils/apiConfig";

const baseUrl = getApiBaseUrl();

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (owner) => `/notifications/${owner}`,
      providesTags: (result, error, owner) => [
        { type: "Notifications", id: owner },
      ],
    }),
    getUnreadCount: builder.query({
      query: (owner) => `/notifications/unread/${owner}`,
      providesTags: (result, error, owner) => [
        { type: "Notifications", id: `unread-${owner}` },
      ],
    }),
    markNotificationsRead: builder.mutation({
      query: ({ owner, ids }) => ({
        url: "/notifications/mark-read",
        method: "POST",
        body: { owner, ids },
      }),
      invalidatesTags: (result, error, { owner }) => [
        { type: "Notifications", id: owner },
        { type: "Notifications", id: `unread-${owner}` },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
} = notificationApi;
