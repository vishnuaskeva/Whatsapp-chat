import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  // unreadCounts shape: { ownerUsername: { actorUsername: count, ... }, ... }
  unreadCounts: {},
};

const computePerActorUnread = (notificationsForOwner = []) => {
  const counts = {};
  notificationsForOwner.forEach((n) => {
    if (!n.read) {
      const actor = n.actor || n.data?.sender || 'unknown';
      counts[actor] = (counts[actor] || 0) + 1;
    }
  });
  return counts;
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const note = action.payload;
      state.notifications.push(note);
      const owner = note.owner;
      const actor = note.actor || note.data?.sender || 'unknown';
      state.unreadCounts[owner] = state.unreadCounts[owner] || {};
      state.unreadCounts[owner][actor] = (state.unreadCounts[owner][actor] || 0) + 1;
    },
    setNotifications: (state, action) => {
      // payload: { owner, notifications }
      const { owner, notifications } = action.payload;
      state.notifications = notifications || [];
      state.unreadCounts[owner] = computePerActorUnread(notifications || []);
    },
    markNotificationsRead: (state, action) => {
      const { owner, ids } = action.payload;
      // mark notifications read in state
      state.notifications = state.notifications.map((notif) =>
        ids.includes(notif._id) ? { ...notif, read: true } : notif
      );

      // decrement per-actor counts based on which notifications were marked
      const countsToSubtract = {};
      state.notifications.forEach((n) => {
        if (ids.includes(n._id)) {
          const actor = n.actor || n.data?.sender || 'unknown';
          countsToSubtract[actor] = (countsToSubtract[actor] || 0) + 1;
        }
      });

      state.unreadCounts[owner] = state.unreadCounts[owner] || {};
      Object.keys(countsToSubtract).forEach((actor) => {
        state.unreadCounts[owner][actor] = Math.max(
          0,
          (state.unreadCounts[owner][actor] || 0) - countsToSubtract[actor]
        );
        if (state.unreadCounts[owner][actor] === 0) {
          delete state.unreadCounts[owner][actor];
        }
      });
    },
    clearNotificationsForUser: (state, action) => {
      const owner = action.payload;
      state.notifications = state.notifications.filter((n) => n.owner !== owner);
      state.unreadCounts[owner] = {};
    },
  },
});

export const {
  addNotification,
  setNotifications,
  markNotificationsRead,
  clearNotificationsForUser,
} = notificationSlice.actions;

export default notificationSlice.reducer;
