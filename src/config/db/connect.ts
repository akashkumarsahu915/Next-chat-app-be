import mongoose from "mongoose";
const mongo_url = process.env.MONGO_URI;

if (!mongo_url) {
    throw new Error("MONGO_URI is not defined in environment variables");
}

const connectDB = async () => {
    try {
        await mongoose.connect(mongo_url);
        console.log(`MongoDB connected`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

export default connectDB;