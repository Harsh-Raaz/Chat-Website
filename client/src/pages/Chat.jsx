import React, { useState } from 'react'
import EmojiPicker from "emoji-picker-react";
import { MessageCircle, Search, Ellipsis, Smile, Send } from 'lucide-react';
import { socket } from '../socket/Socket';

const contacts = [
  { id: 1, name: "Asta", role: "Anti-Magic", avatar: "https://i.pinimg.com/736x/e5/27/f2/e527f2e037e8eea589c1cb7cbc101803.jpg", online: true, unread: 3, last: "sent you a file ✦", time: "1h" },
  { id: 2, name: "Yuno", role: "Wind Magic", avatar: "https://avatarfiles.alphacoders.com/110/thumb-1920-110582.png", online: false, unread: 9, last: "sounds good ✦", time: "3d" },
  { id: 3, name: "Eren Yeager", role: "Titan", avatar: "https://avatarfiles.alphacoders.com/352/352802.jpg", online: true, unread: 0, last: "It's your end ✦", time: "20m" },
  { id: 4, name: "Spiderman", role: "SuperHero", avatar: "https://pbs.twimg.com/profile_images/1222646977332174849/xWcD6t_Q_400x400.jpg", online: true, unread: 4, last: "Coming..", time: "2m" },
  { id: 5, name: "Monkey D. Luffy", role: "Pirate King", avatar: "https://avatarfiles.alphacoders.com/366/366278.jpg", online: true, unread: 0, last: "Need Food 🍖", time: "10m" },
]

const Chat = () => {
  const [active, setActive] = useState(1);
  const [message, setMessage] = useState("")
  const [showEmoji, setShowEmoji] = useState(false);
  const activeContact = contacts.find(c => c.id === active);


  return (
    <div className="min-h-screen w-full bg-linear-to-br from-indigo-100 via-purple-200 to-pink-200 flex items-center justify-center p-4">
      {/* Main div */}
      <div className="max-w-6xl w-full h-[85vh] rounded-3xl shadow-2xl bg-white flex overflow-hidden">

        {/* Left section */}
        <div className="w-75 h-full bg-linear-to-b from-indigo-100 via-purple-100 to-pink-100 flex flex-col p-5">

          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 shadow-md">
                <MessageCircle className="text-white w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">Messages</h2>
            </div>
            <button className="p-2 rounded-full hover:bg-white/60 transition-all duration-200 hover:scale-105">
              <Search className="text-gray-600 w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white/50 rounded-2xl px-3 py-2 mb-4 border border-white/70">
            <Search className="text-gray-400 w-3.5 h-3.5" />
            <input placeholder="Search..." className="bg-transparent text-xs outline-none flex-1 text-gray-600 placeholder-gray-400" />
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {contacts.map((user) => (
              <div
                key={user.id}
                onClick={() => setActive(user.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${active === user.id
                  ? 'bg-white shadow-md'
                  : 'hover:bg-white/50'
                  }`}>

                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <img className="rounded-xl w-10 h-10 object-cover object-top" src={user.avatar} alt={user.name} />
                  {user.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                  )}
                </div>

                {/* Name + last msg */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h1 className="text-sm font-semibold text-gray-800 truncate">{user.name}</h1>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">{user.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.last}</p>
                </div>

                {/* Unread badge */}
                {user.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.unread}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* New Chat Button */}
          <button className="mt-4 bg-linear-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-2xl shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200 text-sm font-semibold">
            + New Chat
          </button>
        </div>

        {/* Right section */}
        <div className="flex-1 bg-white h-full flex flex-col">

          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeContact?.avatar}
                  alt="profile"
                  className="w-10 h-10 rounded-xl object-cover object-top shadow-sm"
                />
                {activeContact?.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{activeContact?.name}</h3>
                <p className={`text-xs ${activeContact?.online ? 'text-green-500' : 'text-gray-400'}`}>
                  {activeContact?.online ? '● Online' : '● Offline'} · {activeContact?.role}
                </p>
              </div>
            </div>
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600">
              <Ellipsis className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4 bg-gray-50/50">

            {/* Other User Message */}
            <div className="flex flex-col items-start">
              <div className="flex items-end gap-2">
                <img src={activeContact?.avatar} className="w-6 h-6 rounded-lg object-cover object-top mb-1" />
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm max-w-xs text-sm text-gray-700 border border-gray-100">
                  Hey! How are you?
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-1 ml-8">10:30 AM</span>
            </div>

            {/* Current User Message */}
            <div className="flex flex-col items-end">
              <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm max-w-xs text-sm">
                I'm good! What about you?
              </div>
              <span className="text-xs text-gray-400 mt-1">10:31 AM</span>
            </div>

          </div>

          {/* Message Input */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2.5 border border-gray-200">

              <div className="relative">
                <Smile
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="cursor-pointer hover:scale-110 transition text-gray-400 w-5 h-5 shrink-0"
                />

                {showEmoji && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        setMessage((prev) => prev + emojiData.emoji)
                      }
                    />
                  </div>
                )}
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message ${activeContact?.name}...`}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />

              <button className="bg-linear-to-r from-purple-500 to-pink-500 text-white p-2 rounded-xl hover:scale-105 hover:shadow-md transition-all cursor-pointer shrink-0">
                <Send className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Chat