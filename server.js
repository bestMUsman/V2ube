const express = require("express");
const socketIO = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

var cb1 = function(req, res, next) {
  res.send("hello", INDEX);
  next();
};

const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .use(express.static(path.join(__dirname, "public")))
  .get("/", function(req, res) {
    res.sendFile(INDEX);
  })
  .get("/Roomname=:id", function(req, res) {
    res.sendFile(INDEX);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on("connection", function(socket) {
  /* User Connection/Disconnection Starts */
  console.log("a user connected");
  socket.on("disconnect", function() {
    console.log("a user disconnected");

    io.sockets.in(socket.userRoom).emit("user got disconnected", {
      name: socket.username,
    });
  });

  socket.on("user joined", function(data) {
    socket.username = data.name;
    io.sockets.in(socket.userRoom).emit("got new user", {
      name: socket.username,
    });
  });
  /* User Ends */

  /* Room Starts */
  socket.on("room", function(room) {
    socket.userRoom = room; // Setting up new room for the session of user
    if (Object.keys(io.sockets.adapter.sids[socket.id]).length >= 2) {
      socket.leave(socket.rooms[Object.keys(socket.rooms)[1]]);
    }
    socket.join(room);
    console.log("Listing All Rooms: " + io.sockets.adapter.rooms);
    io.sockets.emit("rooms count", io.sockets.adapter.rooms);
  });
  /* Room Ends */

  /* Chat Section Starts in Server */
  socket.on("chat message", function(data) {
    console.log(
      "Room: " +
        socket.userRoom +
        ", Msg: " +
        data.msg +
        ", User: " +
        socket.username
    );
    console.log(data.msg);
    io.sockets.in(socket.userRoom).emit("new message", {
      msg: data.msg,
      name: socket.username,
    });
  });
  /* Chat Ends in Server */

  /* Youtube Section Starts in Server */
  socket.on("sending url to server", function(data) {
    io.sockets.in(socket.userRoom).emit("sending url to everyone", {
      url: data.url,
    });
  });

  socket.on("play video now to server", function(room) {
    io.sockets.in(room).emit("playing video for everyone");
  });

  socket.on("pause video now to server", function(room) {
    io.sockets.in(room).emit("pausing video for everyone");
  });

  socket.on("new time send to server", function(data) {
    console.log(`the following: room=>${socket.userRoom} time=>${data.time}`);

    io.sockets.in(socket.userRoom).emit("send this time to everyone", {
      time: data.time,
    });
  });
  /* Youtube Ends in Server */
});
