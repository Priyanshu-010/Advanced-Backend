import express from "express";
import dotenv from "dotenv";
import connectDb from "./lib/db.js";
import User from "./model/user.model.js"
import Redis from "ioredis"

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();
const redis = new Redis(process.env.REDIS_URL)

app.use(express.json())


app.get("/", (req, res)=>{
  return res.status(200).json({
    message: "Hello World from docker hello"
  })
})

app.post("/create", async (req, res)=>{
  const {name, email, password} = req.body
  const user = await User.create({name, email, password})
  return res.status(200).json(user)
})

app.get("/users", async (req, res)=>{
  const users = await User.find({})
  return res.status(200).json(users)
})

app.get("/get-with-redis", async (req, res)=>{
  const cached = await redis.get("user:all")
  console.log("redis")

  if (cached) {
    return res.status(200).json(JSON.parse(cached))
  }

  const users = await User.find({})
  await redis.set("user:all", JSON.stringify(users))
  console.log("rest")
  return res.status(200).json(users)
})

app.listen(port, ()=>{
  connectDb()
  console.log(`Server is running on port ${port}`)
})