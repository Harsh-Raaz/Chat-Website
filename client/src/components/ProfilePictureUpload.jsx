import React, { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const ProfilePictureUpload = ({ user, loading, onUpload, onRemove, onError }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      onError("Profile picture must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Profile picture must be less than 5MB.");
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    await onUpload(file);
    setPreview("");
  };

  const imageUrl = preview || user?.profilePicture || user?.profilePic || "/vite.svg";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src={imageUrl}
          alt={user?.name || "Profile"}
          className="w-28 h-28 rounded-3xl object-cover object-top border-4 border-white shadow-lg bg-white"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -right-2 -bottom-2 p-3 rounded-2xl bg-purple-600 text-white shadow-lg hover:bg-purple-700 disabled:opacity-60"
          title="Upload profile picture"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        {(user?.profilePicture || user?.profilePic) && (
          <button
            type="button"
            onClick={onRemove}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
