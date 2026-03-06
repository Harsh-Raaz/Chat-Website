import { create } from "zustand"
import axios from "axios"

axios.defaults.baseURL = 'http://localhost:4000/api';
axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
    user: null,
    loading: false,
    error: null,

    signUp: async (formdata) => {
        try {
            set({ loading: true, error: null });

            const { data } = await axios.post("/register", formdata)
            set({ user: data.user, loading: false, error: data.message });
            return true
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || "Something went wrong",
            });
            return false
        }
    },

    login: async (formdata) => {
        try {
            set({ loading: true, error: null });

            const { data } = await axios.post("/login", formdata)
            set({ user: data.user, loading: false, error: data.message });
            return true
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || "Something went wrong",
            });
            return false
        }
    },


}))