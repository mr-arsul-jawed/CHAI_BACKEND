import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"


const connectDB = async ()=>{
    try {
      const connecttionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      console.log(`\n MongoDB connected !! DB HOST: ${connecttionInstant.connection.host}`); // it is check where are connect or not
      
    } catch (error) {
        console.log("MONGODB Connection Failed", error);
        process.exit(1);
        
    }
}

export default connectDB;