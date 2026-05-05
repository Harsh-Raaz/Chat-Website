import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { AlertCircle, Check, CheckCheck, Clock, Ellipsis, MessageCircle, Send, Smile } from "lucide-react";

const ChatWindow = ({
  selectedUser,
  currentUserId,
  messages,
  socketErrors,
  onSendMessage,
  onMarkAsRead,
  isConnected,
}) => {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    const unreadMessageIds = messages
      .filter((msg) => {
        const to = msg.to?.toString();
        const from = msg.from?.toString();
        return to === currentUserId && from === (selectedUser._id || selectedUser.id)?.toString() && !msg.isRead && !msg.readAt;
      })
      .map((msg) => msg._id || msg.id)
      .filter(Boolean);

    if (unreadMessageIds.length) {
      onMarkAsRead?.(unreadMessageIds, selectedUser._id || selectedUser.id);
    }
  }, [currentUserId, messages, onMarkAsRead, selectedUser]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser) return;
    onSendMessage(message.trim());
    setMessage("");
    setShowEmoji(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 bg-white h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Search for a user to open a direct chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={selectedUser.profilePicture || selectedUser.profilePic || "/vite.svg"}
            alt={selectedUser.name}
            className="w-10 h-10 rounded-xl object-cover object-top shadow-sm"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-sm truncate">{selectedUser.name}</h3>
            <p className={isConnected ? "text-xs text-green-500" : "text-xs text-gray-400"}>
              {isConnected ? "Connected" : "Disconnected"} · {selectedUser.email}
            </p>
          </div>
        </div>
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600">
          <Ellipsis className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.from?.toString() === currentUserId;
            return (
              <div key={msg._id || msg.id || msg.tempId} className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                <div className="flex items-end gap-2 max-w-xs">
                  {!isOwnMessage && (
                    <img
                      src={selectedUser.profilePicture || selectedUser.profilePic || "/vite.svg"}
                      alt={selectedUser.name}
                      className="w-6 h-6 rounded-lg object-cover object-top mb-1"
                    />
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm border break-words ${
                      isOwnMessage
                        ? "bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-br-sm border-transparent"
                        : "bg-white text-gray-700 rounded-bl-sm border-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {isOwnMessage && getMessageStatusIcon(msg.status || msg.readStatus)}
                </div>
                <span className="text-xs text-gray-400 mt-1" title={msg.readAt ? `Read at ${formatTime(msg.readAt)}` : ""}>
                  {formatTime(msg.timestamp || msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {socketErrors.length > 0 && (
        <div className="px-6 py-2 bg-red-50 border-t border-red-100">
          {socketErrors.map((error, index) => (
            <div key={`${error.message}-${index}`} className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              {error.message}
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2.5 border border-gray-200">
          <div className="relative">
            <Smile
              onClick={() => setShowEmoji((value) => !value)}
              className="cursor-pointer hover:scale-110 transition text-gray-400 w-5 h-5 shrink-0"
            />
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker onEmojiClick={(emojiData) => setMessage((value) => value + emojiData.emoji)} />
              </div>
            )}
          </div>
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.name}...`}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
            className="bg-linear-to-r from-purple-500 to-pink-500 text-white p-2 rounded-xl hover:scale-105 hover:shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
