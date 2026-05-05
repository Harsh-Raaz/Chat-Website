import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, LogOut, Mail, Pencil, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import { useAuthStore } from "../store/authStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    loading,
    logoutUser,
    refreshProfile,
    removeAvatar,
    updateProfile,
    uploadAvatar,
  } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    refreshProfile()
      .then((profile) => {
        setFormData({
          name: profile?.name || "",
          email: profile?.email || "",
        });
      })
      .catch(() => {});
  }, [refreshProfile]);

  const validate = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (name.length < 2 || name.length > 50) return "Name must be 2-50 characters.";
    if (!emailRegex.test(email)) return "Please enter a valid email.";
    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setError("");
      await updateProfile({ name: formData.name.trim(), email: formData.email.trim() });
      setEditMode(false);
      setSuccess("Profile updated.");
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.message || "Could not update profile.");
    }
  };

  const handleUpload = async (file) => {
    try {
      setError("");
      await uploadAvatar(file);
      setSuccess("Profile picture updated.");
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.message || "Could not upload profile picture.");
    }
  };

  const handleRemove = async () => {
    try {
      setError("");
      await removeAvatar();
      setSuccess("Profile picture removed.");
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.message || "Could not remove profile picture.");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-indigo-100 via-purple-200 to-pink-200 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <button
            onClick={() => navigate("/chat")}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            title="Back to chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setEditMode((value) => !value)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            title="Edit profile"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-8 p-6">
          <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-center">
            <ProfilePictureUpload
              user={user}
              loading={loading}
              onUpload={handleUpload}
              onRemove={handleRemove}
              onError={(message) => {
                setError(message);
                setSuccess("");
              }}
            />
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">Name</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  value={formData.name}
                  disabled={!editMode || loading}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 pl-10 py-2.5 text-sm text-gray-900 disabled:bg-gray-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  value={formData.email}
                  disabled={!editMode || loading}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 pl-10 py-2.5 text-sm text-gray-900 disabled:bg-gray-50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
            {success && (
              <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" />
                {success}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

              {editMode && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ name: user?.name || "", email: user?.email || "" });
                      setEditMode(false);
                      setError("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-pink-500 text-white font-semibold disabled:opacity-60"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
