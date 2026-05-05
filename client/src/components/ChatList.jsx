import React from "react";
import UnreadBadge from "./UnreadBadge";

const formatPreviewTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatList = ({ conversations, selectedUserId, unreadCounts = {}, onSelectUser }) => {
  if (!conversations.length) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 text-center text-xs text-gray-500">
        Search by email to start a direct chat.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
      {conversations.map((conversation) => {
        const user = conversation.user;
        const userId = (user._id || user.id)?.toString();
        const isActive = selectedUserId === userId;
        const unreadCount = unreadCounts[userId] || 0;

        return (
          <button
            key={userId}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 ${
              isActive
                ? "bg-white shadow-md"
                : unreadCount
                  ? "bg-white/80 shadow-sm"
                  : "hover:bg-white/50"
            }`}
          >
            <div className="relative shrink-0">
              <img
                className="rounded-xl w-10 h-10 object-cover object-top"
                src={user.profilePicture || user.profilePic || "/vite.svg"}
                alt={user.name}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className={`text-sm text-gray-800 truncate ${unreadCount ? "font-bold" : "font-semibold"}`}>
                  {user.name}
                </h1>
                <span className="text-xs text-gray-400 shrink-0 ml-1">
                  {formatPreviewTime(conversation.lastMessage?.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs truncate flex-1 ${unreadCount ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                  {conversation.lastMessage?.content || user.email}
                </p>
                <UnreadBadge count={unreadCount} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
