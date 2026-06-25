import express from 'express';

import { getInterviewRoles,addInterviewRole,updateInterviewCompany,addInterviewCompany,deleteInterviewCompany,updateInterviewRole,getInterviewCompanies,getInterviewQuestionByCompany,deleteInterviewRole, getQuestionsByRole } from '../controllers/interview.controller.js';
import { authMiddleware, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const interviewRouter = express.Router();

interviewRouter.get('/roles', getInterviewRoles);
interviewRouter.get('/role/:roleId', getQuestionsByRole);

interviewRouter.post(
  '/role',
  authMiddleware,
  authorize("admin"),
  upload.fields([
    {name: "imageFile",maxCount:1},
    {name: "csvFile",maxCount:1}
  ]),addInterviewRole);
interviewRouter.put('/role/:roleId',authMiddleware,authorize("admin"),upload.fields([
  {name : "imageFile",maxCount:1},
  {name:"csvFile",maxCount:1}
]),updateInterviewRole);
interviewRouter.delete('/role/:roleId',authMiddleware,authorize("admin"),deleteInterviewRole);
interviewRouter.get('/companies',getInterviewCompanies);
interviewRouter.get('/company/:companyId',getInterviewQuestionByCompany);
interviewRouter.post('/',authMiddleware,authorize("admin"),upload.fields([
    {name : "logFile",maxCount:1},
  {name:"csvFile",maxCount:1}
]),addInterviewCompany);
interviewRouter.put('/:companyId',authMiddleware,authorize("admin"),upload.fields([
    {name : "logFile",maxCount:1},
  {name:"csvFile",maxCount:1}
]),updateInterviewCompany);
interviewRouter.delete('/:companyId',authMiddleware,authorize("admin"),deleteInterviewCompany);
export default interviewRouter;