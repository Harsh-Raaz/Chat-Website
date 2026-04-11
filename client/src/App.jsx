import './App.css'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Chat from './pages/Chat'
import { Routes, Route } from "react-router-dom"
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import ProtectRoute from './ProtectedRoutes/ProtectRoute'


function App() {

  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <>
      <Routes>
        <Route
          path="/chat"
          element={<ProtectRoute><Chat /></ProtectRoute>}
        />
        <Route path='/' element={<SignUp></SignUp>} />
        <Route path="/login" element={<Login></Login>} />
      </Routes>
    </>
  )
}

export default App
