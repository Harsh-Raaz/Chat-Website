import { useCallback, useEffect, useState } from 'react';
import { socket } from '../socket/socket.js';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [socketErrors, setSocketErrors] = useState([]);
  const [groupUpdates, setGroupUpdates] = useState([]);

  useEffect(() => {
    // Connect socket
    socket.connect();

    // Connection established
    socket.on('socket_connected', (data) => {
      console.log('Socket connected:', data);
      setIsConnected(true);
    });

    // Room joined
    socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
    });

    // Receive message
    socket.on('receive_message', (message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, {
        ...message,
        id: message._id || message.id || message.tempId || Date.now(),
        status: message.readAt ? 'read' : 'delivered'
      }]);

      // Confirm message received for direct messages
      if (message.to && (message._id || message.id || message.tempId)) {
        socket.emit('message_received', {
          messageId: message._id || message.id || message.tempId,
          senderId: message.from
        });
      }
    });

    // Message delivered
    socket.on('message_delivered', (data) => {
      console.log('Message delivered:', data);
      setMessages(prev => prev.map(msg =>
        msg.tempId === data.tempId ? {
          ...msg,
          ...data,
          id: data._id || data.id || msg.id,
          status: 'delivered',
          deliveredAt: data.deliveredAt
        } : msg
      ));
    });

    // Delivery confirmation
    socket.on('message_delivery_confirmation', (data) => {
      console.log('Delivery confirmed:', data);
      setMessages(prev => prev.map(msg =>
        msg.tempId === data.messageId || msg._id === data.messageId || msg.id === data.messageId
          ? { ...msg, status: 'delivered', deliveredAt: data.receivedAt }
          : msg
      ));
    });

    socket.on('messages_read', ({ messageIds, readAt }) => {
      const ids = new Set(messageIds || []);
      setMessages(prev => prev.map(msg => {
        const messageId = msg._id || msg.id;
        return ids.has(messageId)
          ? { ...msg, status: 'read', readStatus: 'read', isRead: true, readAt }
          : msg;
      }));
    });

    socket.on('messages_deleted', ({ messageIds }) => {
      const ids = new Set(messageIds || []);
      setMessages(prev => prev.filter((msg) => !ids.has(msg._id || msg.id)));
    });

    socket.on('group_members_updated', (data) => {
      console.log('Group members updated:', data);
      setGroupUpdates(prev => [...prev, data]);
    });

    socket.on('group_left', (data) => {
      console.log('Left group:', data);
      setGroupUpdates(prev => [...prev, { ...data, type: 'left' }]);
    });

    socket.on('group_removed', (data) => {
      console.log('Removed from group:', data);
      setGroupUpdates(prev => [...prev, { ...data, type: 'removed' }]);
    });

    // Message error
    socket.on('message_error', (error) => {
      console.error('Message error:', error);
      setSocketErrors(prev => [...prev, error]);
    });

    // Socket error
    socket.on('socket_error', (error) => {
      console.error('Socket error:', error);
      setSocketErrors(prev => [...prev, error]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('socket_connected');
      socket.off('room_joined');
      socket.off('receive_message');
      socket.off('message_delivered');
      socket.off('message_delivery_confirmation');
      socket.off('messages_read');
      socket.off('messages_deleted');
      socket.off('group_members_updated');
      socket.off('group_left');
      socket.off('group_removed');
      socket.off('message_error');
      socket.off('socket_error');
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId) => {
    socket.emit('join_room', { roomId });
    setCurrentRoom(roomId);
  }, []);

  const sendMessage = useCallback((payload) => {
    const tempId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const messageData = { ...payload, tempId };

    // Add to local messages immediately with pending status
    setMessages(prev => [...prev, {
      ...messageData,
      id: tempId,
      status: 'sending',
      timestamp: new Date().toISOString()
    }]);

    socket.emit('send_message', messageData, (response) => {
      if (response.status === 'error') {
        // Update message status to error
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...msg, status: 'error' } : msg
        ));
      } else if (response.message) {
        setMessages(prev => prev.map(msg =>
          msg.tempId === tempId ? {
            ...msg,
            ...response.message,
            id: response.message._id || response.message.id || tempId,
            status: response.message.readAt ? 'read' : 'delivered',
          } : msg
        ));
      }
    });
  }, []);

  const deleteMessages = useCallback((messageIds) => {
    socket.emit('delete_messages', { messageIds }, (response) => {
      if (response?.status === 'error') {
        setSocketErrors(prev => [...prev, { message: response.message || 'Could not delete messages' }]);
      }
    });
  }, []);

  const confirmMessageReceived = useCallback((messageId, senderId) => {
    socket.emit('message_received', { messageId, senderId });
  }, []);

  const markMessagesAsRead = useCallback((messageIds, senderId, callback) => {
    socket.emit('mark_as_read', { messageIds, senderId }, callback);
  }, []);

  const getUnreadCountsFromSocket = useCallback((callback) => {
    socket.emit('get_unread_counts', callback);
  }, []);

  const clearErrors = useCallback(() => {
    setSocketErrors([]);
  }, []);

  return {
    isConnected,
    messages,
    setMessages,
    currentRoom,
    currentUser,
    socketErrors,
    joinRoom,
    sendMessage,
    deleteMessages,
    confirmMessageReceived,
    markMessagesAsRead,
    getUnreadCountsFromSocket,
    clearErrors,
    groupUpdates,
    setGroupUpdates,
    setCurrentUser
  };
};
