import express from "express";
import dotenv from "dotenv";
import connectDb from "./lib/db.js";
import User from "./model/user.model.js";
import Redis from "ioredis";

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();
const redis = new Redis(process.env.REDIS_URL);

app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Hello World from docker hello",
  });
});

// Cache in redis

app.post("/create", async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });
  await redis.del("user:all");
  return res.status(200).json(user);
});

app.get("/users", async (req, res) => {
  const users = await User.find({});
  return res.status(200).json(users);
});

app.get("/get-with-redis", async (req, res) => {
  const cached = await redis.get("user:all");
  console.log("redis");

  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const users = await User.find({});
  await redis.set("user:all", JSON.stringify(users));
  console.log("rest");
  return res.status(200).json(users);
});

// OTP storage

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email}`, otp, "EX", 60);

  return res.status(200).json(otp);
});
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const cachedOtp = await redis.get(`otp:${email}`);
  if (!cachedOtp) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }
  if (cachedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await redis.del(`otp:${email}`);
  return res.status(200).json({ message: "OTP verified" });
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
