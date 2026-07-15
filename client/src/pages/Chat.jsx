import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import UserSearch from "../components/UserSearch";
import { getConversations, getMessageHistory, getGroupMessageHistory, getUnreadCounts, getUserProfile, uploadChatAttachment } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/authStore";

const getUserId = (user) => (user?._id || user?.id || "").toString();

const upsertConversation = (conversations, user, lastMessage = null) => {
  const userId = getUserId(user);
  const nextConversation = { user, lastMessage };
  const existing = conversations.filter((conversation) => getUserId(conversation.user) !== userId);
  return [nextConversation, ...existing];
};

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = getUserId(user);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const latestMessageIdRef = useRef("");

  const {
    isConnected,
    messages,
    setMessages,
    sendMessage,
    deleteMessages,
    markMessagesAsRead,
    getUnreadCountsFromSocket,
    socketErrors,
    clearErrors,
    joinRoom,
  } = useSocket();

  const selectedUserId = getUserId(selectedUser);

  useEffect(() => {
    clearErrors();

    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const data = await getConversations();
        setConversations(data);
        const counts = await getUnreadCounts();
        setUnreadCounts(counts.unreadCounts);
        setTotalUnread(counts.totalUnread);
      } catch (error) {
        setHistoryError(error.response?.data?.message || "Could not load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [clearErrors]);

  useEffect(() => {
    if (!isConnected) return;

    getUnreadCountsFromSocket((response) => {
      if (response?.status === "ok") {
        setUnreadCounts(response.unreadCounts || {});
        setTotalUnread(response.totalUnread || 0);
      }
    });
  }, [getUnreadCountsFromSocket, isConnected]);

  useEffect(() => {
    if (!selectedUser) return;

    const selectedUserId = getUserId(selectedUser);
    const isGroup = selectedUser.type === "group";

    const loadMessages = async () => {
      try {
        setHistoryError("");
        if (isGroup) joinRoom(selectedUser.roomId);
        const history = isGroup ? await getGroupMessageHistory(selectedUser.roomId) : await getMessageHistory(selectedUserId);
        setMessages((currentMessages) => {
          const otherMessages = currentMessages.filter((message) => {
            if (isGroup) return message.roomId !== selectedUser.roomId;
            const from = message.from?.toString();
            const to = message.to?.toString();
            return !(
              (from === currentUserId && to === selectedUserId) ||
              (from === selectedUserId && to === currentUserId)
            );
          });

          return [
            ...otherMessages,
            ...history.map((message) => ({
              ...message,
              id: message._id || message.id,
              status: message.readStatus || "delivered",
            })),
          ];
        });
      } catch (error) {
        setHistoryError(error.response?.data?.message || "Could not load messages");
      }
    };

    loadMessages();
  }, [currentUserId, joinRoom, selectedUser, setMessages]);

  useEffect(() => {
    if (!messages.length || !currentUserId) return;

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.roomId) {
      if (!latestMessage.group) return;
      setConversations((current) => {
        const entry = { type: "group", roomId: latestMessage.roomId, group: latestMessage.group, lastMessage: latestMessage };
        return [entry, ...current.filter((conversation) => conversation.roomId !== latestMessage.roomId)];
      });
      return;
    }
    const from = latestMessage.from?.toString();
    const to = latestMessage.to?.toString();
    const otherUserId = from === currentUserId ? to : from;

    if (!otherUserId) return;

    setConversations((current) => {
      const existing = current.find((conversation) => getUserId(conversation.user) === otherUserId);

      if (!existing) {
        getUserProfile(otherUserId)
          .then((profile) => {
            setConversations((latestConversations) =>
              upsertConversation(latestConversations, profile, latestMessage)
            );
          })
          .catch(() => {});
        return current;
      }

      return upsertConversation(current, existing.user, latestMessage);
    });

    const latestId = latestMessage._id || latestMessage.id || latestMessage.tempId;
    if (latestId && latestMessageIdRef.current !== latestId) {
      latestMessageIdRef.current = latestId;
      if (from !== currentUserId && from !== selectedUserId) {
        setUnreadCounts((current) => {
          const next = { ...current, [from]: (current[from] || 0) + 1 };
          setTotalUnread(Object.values(next).reduce((sum, value) => sum + value, 0));
          return next;
        });
      }
    }
  }, [currentUserId, messages, selectedUserId]);

  const chatMessages = useMemo(() => {
    if (!selectedUserId || !currentUserId) return [];

    return messages.filter((message) => {
      if (selectedUser.type === "group") return message.roomId === selectedUser.roomId;
      const from = message.from?.toString();
      const to = message.to?.toString();
      return (
        (from === currentUserId && to === selectedUserId) ||
        (from === selectedUserId && to === currentUserId)
      );
    });
  }, [currentUserId, messages, selectedUserId]);

  const clearUnreadForUser = useCallback((userId) => {
    setUnreadCounts((current) => {
      if (!current[userId]) return current;
      const next = { ...current, [userId]: 0 };
      setTotalUnread(Object.values(next).reduce((sum, value) => sum + value, 0));
      return next;
    });
  }, []);

  const handleSelectUser = (nextUser) => {
    setSelectedUser(nextUser);
    if (nextUser?.type === "group") {
      clearUnreadForUser(nextUser.roomId);
      return;
    }
    setConversations((current) => upsertConversation(current, nextUser));
    clearUnreadForUser(getUserId(nextUser));
  };

  const handleSendMessage = (content) => {
    if (!selectedUserId || !currentUserId) return;

    if (selectedUser.type === "group") {
      sendMessage({ from: currentUserId, roomId: selectedUser.roomId, content });
      return;
    }

    sendMessage({
      from: currentUserId,
      to: selectedUserId,
      content,
    });

    setConversations((current) =>
      upsertConversation(current, selectedUser, {
        from: currentUserId,
        to: selectedUserId,
        content,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const handleSendFile = async (file) => {
    if (!selectedUserId || !currentUserId || !file) return;

    try {
      const attachment = await uploadChatAttachment(file);
      if (selectedUser.type === "group") {
        sendMessage({ from: currentUserId, roomId: selectedUser.roomId, content: "", attachment });
        return;
      }
      sendMessage({ from: currentUserId, to: selectedUserId, content: "", attachment });
      setConversations((current) =>
        upsertConversation(current, selectedUser, {
          from: currentUserId,
          to: selectedUserId,
          content: attachment.name,
          attachment,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      setHistoryError(error.response?.data?.message || "Could not upload file");
    }
  };

  const handleForwardMessage = (messagesToForward, recipientIds) => {
    if (!currentUserId || !messagesToForward.length || !recipientIds.length) return;

    recipientIds.forEach((recipientId) => {
      const recipient = conversations.find((conversation) => getUserId(conversation.user) === recipientId)?.user;
      if (!recipient) return;

      messagesToForward.forEach((message) => {
        const forwardedMessage = {
          from: currentUserId,
          to: recipientId,
          content: message.content || "",
          attachment: message.attachment || null,
        };
        sendMessage(forwardedMessage);
        setConversations((current) =>
          upsertConversation(current, recipient, {
            ...forwardedMessage,
            timestamp: new Date().toISOString(),
          })
        );
      });
    });
  };

  const handleDeleteMessages = (messageIds) => deleteMessages(messageIds);

  const handleMarkMessagesAsRead = useCallback((messageIds, senderId) => {
    clearUnreadForUser(senderId?.toString());
    markMessagesAsRead(messageIds, senderId, (response) => {
      if (response?.status === "ok") {
        const ids = new Set(response.messageIds || messageIds);
        setMessages((currentMessages) =>
          currentMessages.map((msg) => {
            const messageId = msg._id || msg.id;
            return ids.has(messageId)
              ? { ...msg, isRead: true, readStatus: "read", status: "read", readAt: response.readAt }
              : msg;
          })
        );
      }
    });
  }, [clearUnreadForUser, markMessagesAsRead, setMessages]);

  return (
    <div className="w-screen h-screen bg-white">
      <div className="w-full h-full bg-white flex overflow-hidden">
        <div className="w-75 h-full bg-linear-to-b from-indigo-100 via-purple-100 to-pink-100 flex flex-col p-5">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 shadow-md">
                <MessageCircle className="text-white w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">Messages</h2>
                <p className={isConnected ? "text-xs text-green-600" : "text-xs text-gray-500"}>
                  {isConnected ? "Realtime connected" : "Connecting..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-gray-600 transition"
                title="Profile"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          <UserSearch onSelectUser={handleSelectUser} />

          {historyError && <p className="mb-2 text-xs text-red-500">{historyError}</p>}
          {loadingConversations ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
              Loading conversations...
            </div>
          ) : (
            <ChatList
              conversations={conversations}
              selectedUserId={selectedUserId}
              unreadCounts={unreadCounts}
              onSelectUser={handleSelectUser}
            />
          )}
        </div>

        <ChatWindow
          selectedUser={selectedUser}
          currentUserId={currentUserId}
          messages={chatMessages}
          socketErrors={socketErrors}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onForwardMessage={handleForwardMessage}
          onDeleteMessages={handleDeleteMessages}
          onMarkAsRead={handleMarkMessagesAsRead}
          isConnected={isConnected}
          conversations={conversations}
        />
      </div>
    </div>
  );
};

export default Chat;
