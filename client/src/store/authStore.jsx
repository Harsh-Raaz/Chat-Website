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

    login: async ({ email, password }) => {
        try {
            set({ loading: true, error: null });

            const { data } = await axios.post("/login", { email, password });

            if (!data.success) {
                set({ loading: false, error: data.message });
                return false;
            }

            set({
                user: data.user,
                loading: false,
                error: null
            });

            return true;

        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Server error. Please try again.";

            set({
                loading: false,
                error: message
            });

            return false;
        }
    },

    checkAuth: async () => {
        try {
            set({ loading: true })
            const { data } = await axios.get("/checkauth")
            set({
                user: data.user, loading: false, error: null
            })
            return true;
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Server error. Please try again.";

            set({
                loading: false,
                error: message
            });

            return false;
        }
    },

    logoutUser: async () => {
        try {
            await axios.post("/logout", {});
            setUser(null); // reset Zustand store
        } catch (err) {
            console.log("Logout failed", err);
        }
    }


}))