const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});




// var app = require("express")();
// var http = require("http").Server(app);
// var io = require("socket.io")(http);

// app.get("/", function(req, res) {
//   res.sendFile(__dirname + "/index.html");
// });

// http.listen(3000, function() {
//   console.log("listening on *:3000");
// });

io.on("connection", function(socket) {
  console.log("a user connected");
  socket.on("disconnect", function() {
    console.log("a user disconnected");
    io.emit("user got disconnected", {
      name: socket.username,
    });
  });
});


io.on("connection", function(socket) {

  /* Chat Section Starts in Server */
      socket.on("chat message", function(msg) {
      io.emit("new message", {
        msg: msg,
        name: socket.username,
      });
    });

    socket.on("user joined", function(name) {
      socket.username = name;
      io.emit("got new user", {
        name: socket.username,
      });
    });

  /* Chat Ends in Server */


  /* Youtube Section Starts in Server */
    socket.on("sending url to server", function(url) {
      io.emit("sending url to everyone", {
        url: url,
      });
    });

    socket.on("play video now to server", function() {
      io.emit("playing video for everyone");
    });

    socket.on("pause video now to server", function() {
      io.emit("pausing video for everyone");
    });

    socket.on("new time send to server", function(time) {
      io.emit("send this time to everyone", {
        time: time,
      });
    });
  /* Youtube Ends in Server */

});
