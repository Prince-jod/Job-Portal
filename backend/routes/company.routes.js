import express from "express";
import {addCompany, deleteCompany, getCompanies} from "../controllers/company.controller.js";
import {authMiddleware, authorize} from "../middlewares/authMiddleware.js";
import {upload} from "../middlewares/uploadMiddleware.js";

const companyRouter = express.Router();

companyRouter.get('/', getCompanies);
companyRouter.post('/',authMiddleware,authorize("admin"),upload.single("logo"),addCompany);

companyRouter.delete('/:id',authMiddleware,authorize("admin"),deleteCompany);
export default companyRouter;