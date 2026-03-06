import React from 'react'
import { MessageCircle, Search, Ellipsis, Smile } from 'lucide-react';


const Chat = () => {
    return (
        <div className="min-h-screen w-full bg-linear-to-br from-indigo-100 via-purple-200 to-pink-200 flex items-center justify-center">
            {/* Main div */}
            <div className="max-w-6xl w-full h-[80vh] rounded-3xl shadow-2xl bg-white flex">
                {/* left section */}
                <div className="w-[320px] h-full 
                bg-linear-to-b from-indigo-200 via-purple-200 to-pink-200 
                rounded-l-3xl 
                p-6 
                flex flex-col 
                shadow-inner">

                    {/* Header */}
                    <div className="flex items-center justify-between 
                pb-5 mb-5 
                border-b border-white/40">

                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl 
                        bg-linear-to-r from-purple-500 to-pink-500 
                        shadow-md">
                                <MessageCircle className="text-white w-5 h-5" />
                            </div>

                            <h2 className="text-xl font-semibold 
                       text-gray-800 tracking-tight">
                                Chat
                            </h2>
                        </div>

                        <button className="p-2 rounded-full 
                       hover:bg-white/50 
                       transition-all duration-200 
                       hover:scale-105">
                            <Search className="text-gray-700 w-5 h-5" />
                        </button>
                    </div>

                    {/* Users List Container */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {/* user items will go here */}
                    </div>

                    {/* New Chat Button */}
                    <button className="mt-4 
                       bg-linear-to-r from-purple-500 to-pink-500 
                       text-white 
                       py-3 
                       rounded-2xl 
                       shadow-md 
                       hover:scale-[1.02] 
                       transition">
                        + New Chat
                    </button>
                </div>

                {/* Right section */}
                <div className="flex-1 bg-white h-full flex flex-col rounded-r-3xl">

                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://i.pravatar.cc/150?img=3"
                                alt="profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-800">John Doe</h3>
                                <p className="text-sm text-green-500">Online</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-gray-500 cursor-pointer">
                            <Ellipsis />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 bg-gray-50">

                        {/* Other User Message */}
                        <div className="flex flex-col items-start">
                            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm max-w-xs">
                                Hey! How are you?
                            </div>
                            <span className="text-xs text-gray-400 mt-1">10:30 AM</span>
                        </div>

                        {/* Current User Message */}
                        <div className="flex flex-col items-end">
                            <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-sm max-w-xs">
                                I’m good! What about you?
                            </div>
                            <span className="text-xs text-gray-400 mt-1">10:31 AM</span>
                        </div>

                    </div>

                    {/* Message Input */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
                            <Smile className='cursor-pointer hover:scale-110 transition' />
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent outline-none text-sm"
                            />
                            <button className="bg-linear-to-r from-purple-500 to-pink-500 text-white p-2 rounded-full hover:scale-105 transition cursor-pointer">
                                ➤
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}

export default Chat