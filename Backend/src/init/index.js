import '../env.js';
import mongoose from "mongoose";
import data from "./data.js";
import Thought from "../models/Thought.js";

const MONGO_URL = process.env.MONGO_URI;

main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
})

async function main (){
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Thought.deleteMany({}); // first emptying the collection
    let newData = data.map((thought) => ({...thought, author: '698d310a48842292a3576a4b'}))
    await Thought.insertMany(newData); // inserting sample data

    console.log("Data was initialized")
}

initDB();