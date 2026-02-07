import { useState } from "react";
import { MessageCircle, User, Mail, Lock, EyeClosed, Eye } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const SignUp = () => {

    const [showPassword, setShowPassword] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [avatar, setAvatar] = useState(null)

    const Navigate = useNavigate()

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatar(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("avatar", avatar);

        // Axios

    }

    return (
        <div className="min-h-screen w-full bg-linear-to-br from-indigo-100 via-purple-200 to-pink-200 flex items-center justify-center"
        >

            {/* Center Div */}
            <div className="flex items-center justify-center flex-col gap-4 p-8 max-w-132 w-full">

                {/* Upper Div */}
                <div className="flex flex-col gap-2 items-center">
                    <div className="bg-linear-to-br from-purple-600 to-pink-500 rounded-3xl px-6 py-6 w-min mb-2">
                        <MessageCircle className="text-white" />
                    </div>
                    <h1 className="text-3xl font-poppins font-bold text-black">
                        Create Account
                    </h1>
                    <p className="font-poppins text-gray-600 text-center">
                        Join Our Chat Community today
                    </p>
                </div>

                {/* Card */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-xl p-6 gap-6 w-full">

                    {/* Profile */}
                    <div className="flex flex-col items-center justify-center gap-3">
                        {/* Gradient Border */}
                        <div className="p-0.5 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-indigo-500">
                            <label
                                htmlFor="avatar"
                                className="rounded-full bg-purple-200  w-24 h-24 flex items-center justify-center cursor-pointer overflow-hidden"
                            >
                                {avatar ? (
                                    <img
                                        src={URL.createObjectURL(avatar)}
                                        alt="avatar"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <User className="text-black h-12 w-12" />
                                )}
                            </label>
                        </div>

                        <input
                            id="avatar"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />

                        <p className="text-gray-500 ">Upload Profile Picture</p>
                    </div>


                    {/* User details */}
                    <div className="flex flex-col w-full gap-2">
                        <label className="text-sm font-poppins font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full rounded-lg border border-gray-300 pl-10 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <User className="absolute top-2.5 left-2.5 text-gray-500" />
                        </div>

                        <label className="text-sm font-poppins font-medium text-gray-700">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="Enter your email"
                                className="w-full rounded-lg border border-gray-300 pl-10 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            <Mail className="absolute top-2.5 left-2.5 h-6 w-6 text-gray-500" />
                        </div>

                        <label className="text-sm font-poppins font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                className="w-full rounded-lg border border-gray-300 pl-10 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
                            />
                            {showPassword ? <Eye onClick={() => setShowPassword(!showPassword)} className="absolute top-4 right-4 cursor-pointer text-gray-400 h-4 w-4" /> : <EyeClosed onClick={() => setShowPassword(!showPassword)} className="absolute top-4 right-4 cursor-pointer text-gray-400 h-4 w-4" />}

                            <Lock className="absolute top-2.5 left-2.5 h-6 w-6 text-gray-500" />
                        </div>
                    </div>

                    {/* Button */}
                    <button className="w-full  bg-linear-to-r from-purple-600 to-pink-500 text-white py-2.5 rounded-2xl font-semibold hover:opacity-90 transition-all cursor-pointer">
                        Create Account
                    </button>

                    {/* Footer */}
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <span onClick={() => Navigate("/login")} className="text-purple-600  font-semibold cursor-pointer">
                            Login
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default SignUp;
