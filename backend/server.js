import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {connectDB} from './config/db.js';
const Port=5000;
const app=express();

//DB
connectDB();

//MIDDLEWARE
app.use(express.json());
app.use(cors());

//ROUTES
app.get('/',(req,res)=>{
  res.send("API WORKING");
})
app.listen(Port,()=>{
  console.log("server is started");
})