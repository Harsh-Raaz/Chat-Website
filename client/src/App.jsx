import './App.css'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Chat from './pages/Chat'
import { Routes, Route } from "react-router-dom"


function App() {

  return (
    <>
      <Routes>
        <Route path='/chat' element={<Chat />} />
        <Route path='/' element={<SignUp></SignUp>} />
        <Route path="/login" element={<Login></Login>} />
      </Routes>
    </>
  )
}

export default App
