import react from 'react'
import Navbar from '../components/Navbar'
import Dashboard from '../components/Dashboard'
import LoginPage from '../components/LoginPage'
const Home=()=>{
  return (
    <div>
      <Navbar/>
      <Dashboard/>
      <LoginPage/>
    </div>
  )
}

export default Home;