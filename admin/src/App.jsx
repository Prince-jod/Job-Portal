import react from 'react';
import {Route,Routes} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddJobs from "./pages/AddJobs";
import ListJob from "./pages/ListJob";
import CompanyPage from "./pages/CompanyPage";
import CompanyQuestionsPage from "./components/CompanyQuestionsPage";
import ListCompanyQs from "./pages/ListCompanyQs";
import RoleQuestion from "./pages/RoleQuestion";
const App=()=>{
  return (
    
    <div>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<Login/>} />
          <Route path="/addjobs" element={<AddJobs/>} />
          <Route path="/companies" element={<CompanyPage/>} />
           <Route path="/company-questions" element={<CompanyQuestionsPage/>} />
         <Router path="/list/role-questions" element={<ListRoleQs/>} />
         <Route path="/list/company-questions" element={<ListCompanyQs/>} />
         <Route path="/role-questions" element={<RoleQuestion/>} />
          <Route path="/list/jobs" element={<ListJob/>} />
        </Routes>
      </div>
    </div>
  )
}
export default App; // this is commit