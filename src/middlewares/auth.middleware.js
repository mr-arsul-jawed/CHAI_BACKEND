import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, res, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
    if (!token) {
       throw new ApiError(401, "Unauthorization request")
    }
 
     const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     if (!decodedToken) {
         throw new ApiError(401, "invalid")
     }
 
 
     const user = User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if (!user) {
         throw new ApiError(401, "Invalid AccessToken")
     }
 
     req.user = user;
     next()
   } catch (error) {
     throw new ApiError(401,error?.message || "invalid access Token")
   }
})