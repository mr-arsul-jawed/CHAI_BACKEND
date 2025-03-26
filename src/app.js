import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

// if are you using app.use then it is make configuration.

app.use(cors({ //It is cors configuration setup
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.urlencoded({extended: true, limit:"16kb"})); // It is urlencoded
app.use(express.static("Public")) //It is use for static file
app.use(express.json()); // the express accept the json()
app.use(cookieParser()); // It is use for cookie parser





//import router
import userRouter from "./routes/user.routes.js"



//router declaration
app.use("/api/v1/users", userRouter)


//example: 
// http://localhost:8000/api/v1/users/register 











//here export app two way.
// export {app};
export default app;