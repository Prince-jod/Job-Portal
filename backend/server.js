import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {connectDB} from './config/db.js';
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js';
import companyRouter from './routes/company.routes.js';
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
app.get('/',(req,res)=>{
  res.send("API WORKING");
})
app.listen(Port,()=>{
  console.log("server is started");
})