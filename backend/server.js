import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {connectDB} from './config/db.js';
//<<<<<<< HEAD
//=======
import authRouter from './routes/auth.routes.js'
//>>>>>>> 3cafe7a (Backend setup and authentication)
const Port=5000;
const app=express();

//DB
connectDB();

//MIDDLEWARE
app.use(express.json());
app.use(cors());

//ROUTES
//<<<<<<< HEAD
//=======
app.use("/api/auth",authRouter);
//>>>>>>> 3cafe7a (Backend setup and authentication)
app.get('/',(req,res)=>{
  res.send("API WORKING");
})
app.listen(Port,()=>{
  console.log("server is started");
})