import express from 'express';
import {authMiddleware,authorize} from '../middlewares/authMiddleware.js';
import {applyJob, getApplicants,getUserApplications} from '../controllers/application.controller.js';

const applicationRouter=express.Router();

applicationRouter.post('/apply/:id',authMiddleware,applyJob);

applicationRouter.get("/user",authMiddleware, getUserApplications);
applicationRouter.get('/:id/applicants',authMiddleware,authorize("admin"),getApplicants);
export default applicationRouter;