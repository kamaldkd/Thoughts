// to load the environment variables at very start while importing, we have created this separate file
import dotenv from 'dotenv';
if(process.env.NODE_ENV != "production") { 
    dotenv.config(); //
}

export default dotenv;