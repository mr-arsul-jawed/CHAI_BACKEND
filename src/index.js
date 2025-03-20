// require("dotenv").config();
import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";
dotenv.config({
    path: './env'
});


//here define the port
const port = process.env.PORT || 3000;




connectDB()
.then(()=>{
   app.listen(port,()=>{
    console.log(`Server running at port: ${port}`);
})
})
.catch((err)=>{
    console.log("MONGODB Connection failed !!!",err);
    
})






/*
import express from "express";

const app = express();
( async ()=>{
    try {
      await mongoose.connect(`${process.env.MONGODB_URI}/ ${DB_NAME}`) 
      app.on("error",(error)=>{
        console.log("Error in server",error);
        throw error;
    })

    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
        
    })
    } catch (error) {
        console.error(error);
        throw error;
    }
})()*/