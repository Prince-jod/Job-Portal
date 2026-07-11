import react from 'react';
import {Route,Routes} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddJobs from "./pages/AddJobs";
import ListJob from "./pages/ListJob";
const App=()=>{
  return (
    
    <div>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<Login/>} />
          <Route path="/addjobs" element={<AddJobs/>} />
          <Route path="/companies" element={<CompanyPage/>} />
          <Route path="/list/jobs" element={<ListJob/>} />
        </Routes>
      </div>
    </div>
  )
}
export default App; // this is commit