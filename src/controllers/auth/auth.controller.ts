import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/user.model";

// Generate UID
const generateUID = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password }: { username: string; email: string; password: string } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      //             This is a MongoDB operator. It means:
      // Find a document where either the email field matches the provided email variable OR the username field matches the provided username variable.
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      uid: generateUID(),
      username,
      email,
      password, // will be hashed automatically
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//  LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    console.log("user is:", user);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select(
      "uid username profilePicture interests bio location"
    );
    // console.log("Fetched user in getMe:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
