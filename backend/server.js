import applicationRouter from './routes/application.routes.js';

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {connectDB} from './config/db.js';
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js';
import companyRouter from './routes/company.routes.js';
import jobRouter from './routes/job.routes.js';
import interviewRouter from './routes/interview.routes.js';
import saveRouter from './routes/saved.routes.js';
import inquiryRouter from './routes/inquiry.routes.js';
const Port=5000;
const app=express();

//DB
connectDB();

//MIDDLEWARE
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static('uploads'));


app.use("/api/auth",authRouter);

app.use("/api/user",userRouter);

app.use("/api/company",companyRouter);
app.use("/api/job",jobRouter);
app.use("/api/interview",interviewRouter);
app.use("/api/application",applicationRouter);
app.use("/api/saved",saveRouter);
app.use("/api/inquiry",inquiryRouter)
app.get('/',(req,res)=>{
  res.send("API WORKING");
})
app.listen(Port,()=>{
  console.log("server is started");
})