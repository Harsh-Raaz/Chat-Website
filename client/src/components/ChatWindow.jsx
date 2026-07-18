import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { AlertCircle, Check, CheckCheck, Clock, Ellipsis, FileText, Forward, LogOut, MessageCircle, Mic, MicOff, Paperclip, Phone, PhoneOff, Send, Smile, Trash2, UserMinus, Users, Video, VideoOff, X } from "lucide-react";
import { socket } from "../socket/socket.js";

const rtcConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "7bf1446144ab03454229b944",
      credential: "G2OLVL7119XKlxkz",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "7bf1446144ab03454229b944",
      credential: "G2OLVL7119XKlxkz",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "7bf1446144ab03454229b944",
      credential: "G2OLVL7119XKlxkz",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "7bf1446144ab03454229b944",
      credential: "G2OLVL7119XKlxkz",
    },
  ],
};

const ChatWindow = ({
  selectedUser,
  currentUserId,
  messages,
  socketErrors,
  onSendMessage,
  onSendFile,
  onForwardMessage,
  onDeleteMessages,
  onMarkAsRead,
  isConnected,
  conversations = [],
  onLeaveGroup,
  onDismissGroup,
  onKickMember,
}) => {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const activePeerIdRef = useRef(null);
  const [call, setCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [forwardRecipientIds, setForwardRecipientIds] = useState([]);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const isGroup = selectedUser?.type === "group";
  const groupCreatorId = (selectedUser?.creator || (isGroup ? selectedUser?._id : null))?.toString();
  const isGroupCreator = isGroup && groupCreatorId && groupCreatorId === currentUserId;

  const cleanupCall = (notifyPeer = false) => {
    if (notifyPeer && activePeerIdRef.current) {
      socket.emit("call_end", { to: activePeerIdRef.current });
    }
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    activePeerIdRef.current = null;
    setCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  const createPeerConnection = (peerId) => {
    const connection = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = connection;
    activePeerIdRef.current = peerId;

    connection.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("call_ice_candidate", { to: peerId, candidate });
    };
    connection.ontrack = ({ streams }) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams[0];
    };
    connection.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(connection.connectionState)) cleanupCall(false);
    };
    return connection;
  };

  const getMedia = async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const addPendingCandidates = async (connection) => {
    await Promise.all(pendingCandidatesRef.current.map((candidate) => connection.addIceCandidate(candidate)));
    pendingCandidatesRef.current = [];
  };

  const startCall = async (callType) => {
    const peerId = (selectedUser?._id || selectedUser?.id)?.toString();
    if (!peerId || !isConnected) return;
    try {
      setCall({ status: "calling", type: callType, peerId });
      const stream = await getMedia(callType);
      const connection = createPeerConnection(peerId);
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      socket.emit("call_user", { to: peerId, offer, callType }, (response) => {
        if (response?.status === "error") cleanupCall(false);
      });
    } catch (error) {
      console.error("Could not start call:", error);
      cleanupCall(false);
    }
  };

  const acceptCall = async () => {
    if (!call?.offer || !call.peerId) return;
    try {
      const stream = await getMedia(call.type);
      const connection = createPeerConnection(call.peerId);
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
      await connection.setRemoteDescription(new RTCSessionDescription(call.offer));
      await addPendingCandidates(connection);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("call_answer", { to: call.peerId, answer });
      setCall((current) => ({ ...current, status: "connected" }));
    } catch (error) {
      console.error("Could not answer call:", error);
      cleanupCall(true);
    }
  };

  const rejectCall = () => cleanupCall(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  useEffect(() => {
    const onIncomingCall = ({ from, offer, callType }) => {
      if (activePeerIdRef.current || peerConnectionRef.current) return;
      activePeerIdRef.current = from;
      setCall({ status: "incoming", type: callType === "video" ? "video" : "audio", peerId: from, offer });
    };
    const onCallAnswered = async ({ from, answer }) => {
      if (from !== activePeerIdRef.current || !peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await addPendingCandidates(peerConnectionRef.current);
      setCall((current) => current && { ...current, status: "connected" });
    };
    const onIceCandidate = async ({ from, candidate }) => {
      if (from !== activePeerIdRef.current || !candidate) return;
      if (peerConnectionRef.current?.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
      }
    };
    const onCallEnded = ({ from }) => {
      if (from === activePeerIdRef.current) cleanupCall(false);
    };

    socket.on("call_incoming", onIncomingCall);
    socket.on("call_answered", onCallAnswered);
    socket.on("call_ice_candidate", onIceCandidate);
    socket.on("call_ended", onCallEnded);
    return () => {
      socket.off("call_incoming", onIncomingCall);
      socket.off("call_answered", onCallAnswered);
      socket.off("call_ice_candidate", onIceCandidate);
      socket.off("call_ended", onCallEnded);
      cleanupCall(false);
    };
  }, []);

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

  const handleFileChange = (event) => {
    const [file] = event.target.files || [];
    if (file) onSendFile?.(file);
    event.target.value = "";
  };

  const getMessageId = (msg) => (msg?._id || msg?.id || msg?.tempId || "").toString();

  const toggleMessageSelection = (msg) => {
    const messageId = getMessageId(msg);
    setSelectedMessages((current) => current.some((item) => getMessageId(item) === messageId)
      ? current.filter((item) => getMessageId(item) !== messageId)
      : [...current, msg]);
  };

  const isMessageSelected = (msg) => selectedMessages.some((item) => getMessageId(item) === getMessageId(msg));

  const openForwardPicker = () => {
    if (!selectedMessages.length) return;
    setForwardRecipientIds([]);
    setShowForwardPicker(true);
  };

  const toggleForwardRecipient = (userId) => {
    setForwardRecipientIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const handleForward = () => {
    if (!selectedMessages.length || !forwardRecipientIds.length) return;
    onForwardMessage?.(selectedMessages, forwardRecipientIds);
    setShowForwardPicker(false);
    setSelectedMessages([]);
    setForwardRecipientIds([]);
  };

  const canDeleteSelectedMessages = selectedMessages.length > 0 && selectedMessages.every((msg) => msg.from?.toString() === currentUserId && msg._id);

  const handleDelete = () => {
    if (!canDeleteSelectedMessages) return;
    if (!window.confirm(`Delete ${selectedMessages.length} selected message${selectedMessages.length === 1 ? "" : "s"} for everyone?`)) return;
    onDeleteMessages?.(selectedMessages.map((msg) => msg._id));
    setSelectedMessages([]);
  };

  const forwardableConversations = conversations.filter((conversation, index, all) => {
    const userId = (conversation.user?._id || conversation.user?.id || "").toString();
    return userId && userId !== currentUserId && all.findIndex((item) => (item.user?._id || item.user?.id || "").toString() === userId) === index;
  });

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

  const getDayKey = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "unknown";
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const formatDayLabel = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "Unknown date";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (getDayKey(date) === getDayKey(today)) return "Today";
    if (getDayKey(date) === getDayKey(yesterday)) return "Yesterday";

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
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
    <div className="flex-1 bg-white h-full flex flex-col relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={isGroup ? (selectedUser.avatar || "/vite.svg") : (selectedUser.profilePicture || selectedUser.profilePic || "/vite.svg")}
            alt={selectedUser.name}
            className="w-10 h-10 rounded-xl object-cover object-top shadow-sm"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-sm truncate">{selectedUser.name}</h3>
            <p className={isConnected ? "text-xs text-green-500" : "text-xs text-gray-400"}>
              {isGroup
                ? `${selectedUser.members?.length || 0} members`
                : `${isConnected ? "Connected" : "Disconnected"} · ${selectedUser.email}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isGroup && (
            <button onClick={() => setShowGroupMembers(true)} title="View members" className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-purple-600">
              <Users className="w-5 h-5" />
            </button>
          )}
          {isGroup && !isGroupCreator && (
            <button onClick={onLeaveGroup} title="Leave group" className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {isGroup && isGroupCreator && (
            <button onClick={onDismissGroup} title="Dismiss group for everyone" className="p-2 rounded-xl hover:bg-red-50 transition-all text-gray-400 hover:text-red-600">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          {!isGroup && <>
          <button onClick={() => startCall("audio")} disabled={!isConnected || call} title="Start voice call" className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-purple-600 disabled:opacity-40">
            <Phone className="w-5 h-5" />
          </button>
          <button onClick={() => startCall("video")} disabled={!isConnected || call} title="Start video call" className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-purple-600 disabled:opacity-40">
            <Video className="w-5 h-5" />
          </button>
          </>}
          <button className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600">
            <Ellipsis className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showGroupMembers && isGroup && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between"><div><h4 className="font-bold text-gray-800">Group members</h4><p className="text-xs text-gray-500">{selectedUser.members?.length || 0} members</p></div><button onClick={() => setShowGroupMembers(false)} className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">{(selectedUser.members || []).filter(Boolean).map((member) => {
              const memberId = (member._id || member.id)?.toString();
              const isMemberCreator = memberId && memberId === groupCreatorId;
              const canKick = isGroupCreator && memberId && memberId !== currentUserId;
              return (
                <div key={memberId} className="flex items-center gap-3 rounded-xl p-2">
                  <img src={member.profilePicture || member.profilePic || "/vite.svg"} alt="" className="h-9 w-9 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">{member.name}</p>
                    <p className="truncate text-xs text-gray-500">{isMemberCreator ? "Creator" : member.email}</p>
                  </div>
                  {canKick && (
                    <button onClick={() => onKickMember?.(memberId)} title="Remove from group" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}</div>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4 bg-gray-50/50">
        {selectedMessages.length > 0 && (
          <div className="sticky top-0 z-20 mx-auto flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-md">
            <span className="text-xs font-semibold text-gray-600">{selectedMessages.length} selected</span>
            <button type="button" onClick={openForwardPicker} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50">
              <Forward className="h-3.5 w-3.5" /> Forward
            </button>
            <button type="button" onClick={handleDelete} disabled={!canDeleteSelectedMessages} title={canDeleteSelectedMessages ? "Delete for everyone" : "Only sent, delivered messages can be deleted"} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button type="button" onClick={() => setSelectedMessages([])} className="p-1 text-gray-400 hover:text-gray-700" title="Clear selection">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.from?.toString() === currentUserId;
            const timestamp = msg.timestamp || msg.createdAt;
            const isFirstMessageOfDay = index === 0 || getDayKey(timestamp) !== getDayKey(messages[index - 1].timestamp || messages[index - 1].createdAt);
            return (
              <React.Fragment key={msg._id || msg.id || msg.tempId}>
                {isFirstMessageOfDay && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-medium text-gray-400">{formatDayLabel(timestamp)}</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                )}
                <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                  <div className="flex items-end gap-2 max-w-xs">
                    {!isOwnMessage && (
                      <img
                        src={selectedUser.profilePicture || selectedUser.profilePic || "/vite.svg"}
                        alt={selectedUser.name}
                        className="w-6 h-6 rounded-lg object-cover object-top mb-1"
                      />
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleMessageSelection(msg)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleMessageSelection(msg);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm border break-words ${
                        isOwnMessage
                          ? "bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-br-sm border-transparent"
                          : "bg-white text-gray-700 rounded-bl-sm border-gray-100"
                      } ${isMessageSelected(msg) ? "cursor-pointer ring-2 ring-purple-300" : "cursor-pointer"}`}
                    >
                      {msg.attachment?.url && (
                        <a
                          href={msg.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 ${msg.content ? "mb-2" : ""} ${isOwnMessage ? "bg-white/20 hover:bg-white/30" : "bg-gray-100 hover:bg-gray-200"}`}
                        >
                          <FileText className="w-5 h-5 shrink-0" />
                          <span className="max-w-44 truncate underline">{msg.attachment.name || "Attachment"}</span>
                        </a>
                      )}
                      {msg.content}
                    </div>
                    {isOwnMessage && getMessageStatusIcon(msg.status || msg.readStatus)}
                  </div>
                  <span className="text-xs text-gray-400 mt-1" title={msg.readAt ? `Read at ${formatTime(msg.readAt)}` : ""}>
                    {formatTime(timestamp)}
                  </span>
                </div>
              </React.Fragment>
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
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            title="Attach a file (max 10 MB)"
            className="text-gray-400 hover:text-purple-500 transition disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
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

      {showForwardPicker && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-800">Forward {selectedMessages.length} message{selectedMessages.length === 1 ? "" : "s"}</h4>
                <p className="mt-1 text-xs text-gray-500">Choose one or more recent chats.</p>
              </div>
              <button type="button" onClick={() => setShowForwardPicker(false)} className="text-gray-400 hover:text-gray-700" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
              {forwardableConversations.length ? forwardableConversations.map((conversation) => {
                const user = conversation.user;
                const userId = (user._id || user.id).toString();
                const isSelected = forwardRecipientIds.includes(userId);
                return (
                  <button
                    type="button"
                    key={userId}
                    onClick={() => toggleForwardRecipient(userId)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${isSelected ? "bg-purple-50 ring-1 ring-purple-300" : "hover:bg-gray-50"}`}
                  >
                    <img src={user.profilePicture || user.profilePic || "/vite.svg"} alt="" className="h-9 w-9 rounded-xl object-cover object-top" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{user.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                  </button>
                );
              }) : <p className="py-5 text-center text-sm text-gray-500">No recent chats to forward to yet.</p>}
            </div>
            <button
              type="button"
              onClick={handleForward}
              disabled={!forwardRecipientIds.length || !isConnected}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send to {forwardRecipientIds.length || "..."} chat{forwardRecipientIds.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {call && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 text-white flex flex-col items-center justify-center p-6">
          {call.type === "video" && <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />}
          {call.type === "audio" && <audio ref={remoteVideoRef} autoPlay />}
          {call.type === "video" && <video ref={localVideoRef} autoPlay muted playsInline className="absolute right-5 top-5 w-32 rounded-xl border-2 border-white/70 shadow-xl" />}
          <div className="relative z-10 text-center bg-slate-900/70 rounded-2xl px-6 py-5 backdrop-blur-sm">
            <p className="text-lg font-semibold">{call.status === "incoming" ? "Incoming" : call.status === "calling" ? "Calling" : "In"} {call.type === "video" ? "video" : "voice"} call</p>
            <p className="text-sm text-white/70 mt-1">{call.status === "incoming" ? "Answer to connect" : selectedUser.name}</p>
            <div className="flex justify-center gap-4 mt-5">
              {call.status === "incoming" ? (
                <>
                  <button onClick={rejectCall} className="p-4 rounded-full bg-red-500 hover:bg-red-600" title="Decline call"><PhoneOff className="w-6 h-6" /></button>
                  <button onClick={acceptCall} className="p-4 rounded-full bg-green-500 hover:bg-green-600" title="Answer call"><Phone className="w-6 h-6" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { const track = localStreamRef.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); } }} className="p-3 rounded-full bg-white/20 hover:bg-white/30" title="Toggle microphone">{isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
                  {call.type === "video" && <button onClick={() => { const track = localStreamRef.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setIsCameraOff(!track.enabled); } }} className="p-3 rounded-full bg-white/20 hover:bg-white/30" title="Toggle camera">{isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}</button>}
                  <button onClick={() => cleanupCall(true)} className="p-4 rounded-full bg-red-500 hover:bg-red-600" title="End call"><PhoneOff className="w-6 h-6" /></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
