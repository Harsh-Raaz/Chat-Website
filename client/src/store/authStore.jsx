import { create } from "zustand"
import axios from "axios"
import {
    getCurrentProfile,
    removeProfilePicture,
    updateCurrentProfile,
    uploadProfilePicture,
} from "../services/api";

axios.defaults.baseURL = 'https://chat-website-backend-holo.onrender.com/api';
axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
    user: null,
    loading: false,
    error: null,
    checkingAuth: true,

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
            set({ checkingAuth: true });
            const { data } = await axios.get("/check");

            set({
                user: data.user,
                checkingAuth: false,
                error: null
            });

        } catch {
            set({
                user: null,
                checkingAuth: false,
                error: null
            });
        }
    },

    logoutUser: async () => {
        try {
            await axios.post("/logout", {});
            set({user:null}); // reset Zustand store
        } catch (err) {
            console.log("Logout failed", err);
        }
    },

    refreshProfile: async () => {
        try {
            const user = await getCurrentProfile();
            set({ user, error: null });
            return user;
        } catch (err) {
            set({ error: err.response?.data?.message || "Could not load profile" });
            throw err;
        }
    },

    updateProfile: async (profile) => {
        try {
            set({ loading: true, error: null });
            const user = await updateCurrentProfile(profile);
            set({ user, loading: false, error: null });
            return user;
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || "Could not update profile",
            });
            throw err;
        }
    },

    uploadAvatar: async (file) => {
        try {
            set({ loading: true, error: null });
            const user = await uploadProfilePicture(file);
            set({ user, loading: false, error: null });
            return user;
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || "Could not upload profile picture",
            });
            throw err;
        }
    },

    removeAvatar: async () => {
        try {
            set({ loading: true, error: null });
            const user = await removeProfilePicture();
            set({ user, loading: false, error: null });
            return user;
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || "Could not remove profile picture",
            });
            throw err;
        }
    },


}))
