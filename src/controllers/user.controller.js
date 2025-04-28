import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { json } from "express"
import jwt from "jsonwebtoken"



const generateAccessAndRefereshTokens = async(userId)=>{

    try {
       const user = await User.findById(userId) 
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false})

       return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the refresh and acess tokens") 
    }
}




const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    // validation- not empty
    // check if user already exists: username || email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, username, email, password} = req.body
    // console.log("email: ", email);

// here: Validation code 
    if (
        [fullName, email, username, password].some((field)=>
        field?.trim() === " ")
    ) {
       throw new ApiError(400, "All fields are required")
    }
     
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "username and email already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
   }


   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
   }
   


    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!avatar) {
     throw new ApiError(400, "Avatar file is required")  
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    return res
    .status(201, 
        json(
            new ApiResponse(200, createdUser, "User registered Successfully")
    ))
 

   
    
})


const loginUser = asyncHandler(async (req, res)=>{
    //req body -> data
    // username or email
    //find the user
    // password check
    //access and refresh token token
    //send cookies

    const {username, email, password} = req.body

    if (!(username || email)) {
        throw new ApiError (404, "username or email are required")
    }

    const user = await User.findOne({
        $or:[{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404,"user not found")
    }
 
    const isPasswordMatch = await user.verifyPassword(password)
    

    if (!isPasswordMatch) {
        throw new ApiError(401, "invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id) //here: generateAccessAndRefereshTokens executed

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in succesfully"
        )
     )

   




    
})

const logOut = asyncHandler( async(req, res)=>{
    // clear cookies
    // update user refresh token to null

   await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
           refreshToken: undefined 
        }
    },
    {
        new: true
    }
   )
   
   const options = {
    httpOnly: true,
    secure: true
   }


   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
    new ApiResponse(200, {}, "User logged-out successfully")
   )
    
})

// frontend use this whenever if your accessToken is expire
const refreshAccessToken = asyncHandler(async (req, res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken 

   if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
   }
   
try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,REFRESH_TOKEN_SECRET
     )
     
     const user = await User.findById(decodedToken?._id)
     if (!user) {
        throw new ApiError(401, "invalid refresh Token")
     }
 
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {
                 accessToken, refreshToken: newRefreshToken 
             },
             "Access token refreshed"
         )
         
     )
} catch (error) {
      throw new ApiError(401,error?.message || "invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
     const {oldPassword, newPassword} = req.body
     
     const user = await User.findById(req.user?._id)

     if (!user) {
        throw new ApiError(404,"user not found")
     }

     const isPasswordcorrect = user.verifyPassword(oldPassword)

     if (!isPasswordcorrect) {
        throw new ApiError(404,"invalid oldPassword password")
     }
     user.password = newPassword
     await user.save({validateBeforeSave:false})

     return res
     .status(200)
     .json(200, {}, "Password changed successfully")
     
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler (async (req, res)=>{
    const {fullName, email} = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
        $set:
        {
            fullName: fullName,
            email: email
        },
        
        },
        {
             new: true
        }
    ).select("-password")



    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res)=>{
     const avatarLocalPath = req.file?.path

     if(!avatarLocalPath){
        throw new ApiError(404, "Avatar file is missing")
     }

     const avatar = await uploadCloudinary(avatarLocalPath)

     if(!avatar.url){
         throw new ApiError(404, "Error while uploading on avatar")
     }

    
     const user = await User.findByIdAndUpdate(req.user?._id,
     {
        $set: {
            avatar:avatar.url
        }
     },
     {
        new: true
     }
    ).select("-password")

     return res
     .status(200)
     .json(new ApiResponse (200, user, "avatar update succesfully"))

})









export {
    registerUser, 
    loginUser, 
    logOut, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails

}