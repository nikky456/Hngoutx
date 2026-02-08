import mongoose from  'mongoose'
import {env} from "./env";

export const connectDB = async()=>{
    try{
        await mongoose.connect(env.MONGO_URI);
        console.log("Mongodb connect sucessfully");

    }catch(error){
        console.error("mongod connection failed",error)
        process.exit(1);
    }
}