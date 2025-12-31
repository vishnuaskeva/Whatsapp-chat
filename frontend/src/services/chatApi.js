import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const chatApi = {
  getConversationMessages: async (participant1, participant2) => {
    const params = new URLSearchParams({ participant1, participant2 });
    const url = `${API_URL}/messages?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  getPersonalNotes: async (username) => {
    const url = `${API_URL}/messages/notes/${username}`;
    const response = await axios.get(url);
    return response.data;
  },

  savePersonalNote: async (username, content) => {
    const url = `${API_URL}/messages/notes`;
    const response = await axios.post(url, { username, content });
    return response.data;
  }
};

export default chatApi;
