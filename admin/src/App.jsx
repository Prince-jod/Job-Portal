import react from 'react';
import {Route,Routes} from "react-router-dom";
import Home from "./pages/Home";

const App=()=>{
  return (
    <div>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  )
}
export default App; // this is commit