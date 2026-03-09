import './App.css'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Chat from './pages/Chat'
import { Routes, Route } from "react-router-dom"
import { useAuthStore } from './store/authStore'
import { Navigate } from 'react-router-dom'

function App() {

  const { user } = useAuthStore()

  return (
    <>
      <Routes>
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />
        <Route path='/' element={<SignUp></SignUp>} />
        <Route path="/login" element={<Login></Login>} />
      </Routes>
    </>
  )
}

export default App
