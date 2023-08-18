const express = require("express");
require("./config/db");
// const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

// const { notFound, errorHandler } = require("./middleware/errorMiddleware");
// // // const path = require("path");
// // Error Handling middlewares
// app.use(notFound);
// app.use(errorHandler)

const PORT=process.env.PORT || 3000;
// dotenv.config();
const cors=require('cors')
const app=express()
app.get('/', (req, res) => {
  res.send('Namaste, Welcome to iTachyon Support Sytem!');
});
app.use(cors())
app.use(express.json());

const path = require("path");
app.use('/uploads/Images', express.static(path.join(__dirname, 'uploads/Images')));
app.use(express.urlencoded({ extended: true }));

// IT WILL REDIRECT TO USER ROUTES FILE :routes/userRoutes.js
app.use("/", userRoutes);
// IT WILL REDIRECT TO TASK ROUTES: routes/taskRoutes.js
app.use("/",taskRoutes)

// IT WILL REDIRECT TO CHAT ROUTES : routes/chatRoutes.js
app.use("/api/chat", chatRoutes);
// IT WILL REDIRECT TO MESSAGE ROUTES: routes/messageRoutes.js
app.use("/api/message", messageRoutes);

// IT WILL REDIRECT TO CLINIC ROUTES: routes/clinicRoutes.js
app.use("/api/clinic",clinicRoutes);

//IT WILL REDIRECT TO PROJECT ROUTES
app.use('/api/project', projectRoutes);

// BIND AND LISTEN FOR ANY CONNECTIONS
const server=app.listen(
 PORT,
 console.log(`Server running on PORT ${PORT}`)
);
//const options = {
  //key: fs.readFileSync('/etc/letsencrypt/live/support.itachyon.com/privkey.pem'),
  //cert: fs.readFileSync('/etc/letsencrypt/live/support.itachyon.com/cert.pem')
//};

//const server = https.createServer(options, app);

//server.listen(3000, () => {
  //console.log('HTTPS server started on port 3000');
//});


// CALLING SOCKET.IO SERVER FOR CHAT
const io = require("socket.io")(server, {
 pingTimeout: 60000,
 cors: {
    origin: "http://localhost:3000",
 },
});

io.on("connection", (socket) => {
 console.log("Connected to socket.io");
 socket.on("setup", (userData) => {
   socket.join(userData._id);
   socket.emit("connected");
 });

 socket.on("join chat", (room) => {
   socket.join(room);
   console.log("User Joined Room: " + room);
 });
 socket.on("typing", (room) => socket.in(room).emit("typing"));
 socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

 socket.on("new message", (newMessageRecieved) => {
   var chat = newMessageRecieved.chat;

   if (!chat.users) return console.log("chat.users not defined");

   chat.users.forEach((user) => {
     if (user._id == newMessageRecieved.sender._id) return;

     socket.in(user._id).emit("message recieved", newMessageRecieved);
   });
 });

 socket.off("setup", () => {
   console.log("USER DISCONNECTED");
   socket.leave(userData._id);
 });
});