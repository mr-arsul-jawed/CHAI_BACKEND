import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"
import  app  from "../app.js";


const connectDB = async ()=>{
    try {
      const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      console.log(`\n MongoDB connected !! DB HOST: ${connectionInstant.connection.host}`); // it is check where are connect or not
     } 
     catch (error) {
        console.log("MONGODB Connection Failed", error);
        process.exit(1);
      }
}

//app.on is checking app error
app.on("err",(err)=>{
  console.log("error",err);
  throw err
  })

export default connectDB;




