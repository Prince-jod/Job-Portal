import react from 'react';
import {Route,Routes} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
const App=()=>{
  return (
    
    <div>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<Login/>} />
          <Route path="/addjobs" element={<AddJobs/>} />
        </Routes>
      </div>
    </div>
  )
}
export default App; // this is commit