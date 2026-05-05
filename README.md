# Chat-Website
A real-time web chat application using React, Node.js, Express, MongoDB, and Socket.io

## Socket Event Contract
### Client → Server events
- `join_room`
  - payload: `{ roomId }`
  - description: Join a shared chat room.
- `send_message`
  - payload: `{ to?, roomId?, content, tempId? }`
  - description: Send a message to a specific user (`to`) or room (`roomId`).
- `message_received`
  - payload: `{ messageId, senderId }`
  - description: Notify the sender that the message has been received.

### Server → Client events
- `socket_connected`
  - payload: `{ message, userId }`
  - description: Connection confirmed after socket auth.
- `room_joined`
  - payload: `{ message }`
  - description: Confirmation that the client joined a room.
- `receive_message`
  - payload: `{ from, to, roomId, content, tempId, timestamp }`
  - description: A new incoming message from another user or room.
- `message_delivered`
  - payload: `{ from, to, roomId, content, tempId, timestamp, deliveryStatus, deliveredAt }`
  - description: Delivery confirmation sent back to the sender.
- `message_delivery_confirmation`
  - payload: `{ messageId, receiverId, status, receivedAt }`
  - description: Confirmation that the recipient has received the message.
- `message_error`
  - payload: `{ status, message }`
  - description: Error during message send flow.
- `socket_error`
  - payload: `{ message }`
  - description: Generic socket-level error.

## Contributors
- @Harsh-Raaz
- @Yamavanshist
