import './App.css'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import {Routes,Route} from "react-router-dom"

function App() {

  return (
    <>
    <Routes>
      <Route path='/' element={<SignUp></SignUp>}/>
      <Route path="/login" element={<Login></Login>}></Route>
    </Routes>
    </>
  )
}

export default App
