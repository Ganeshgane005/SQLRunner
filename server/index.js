require('dotenv').config();
const express=require('express');
const app =express();
const cors=require ('cors');
const connection=require('./db')
const userRoutes=require("./routes/users");
const authRoutes=require("./routes/auth")
const instaceRoutes=require("./routes/Instances.js")
//database connection
connection();
//middleware
app.use(express.json());
app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // React app running on port 3000
  methods: ['GET', 'POST','PATCH','PUT','DELETE'], // Allow specific methods
//  allowedHeaders: ['Content-Type', 'Authorization'], // Allow certain headers
}));
//routes
app.use("/api/users",userRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/instances",instaceRoutes)
const port=process.env.PORT||8080;
app.listen(port,()=>console.log(`Listening on port ${port}`));
