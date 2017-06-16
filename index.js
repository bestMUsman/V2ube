var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  console.log("a user connected");
  socket.on("disconnect", function() {
    console.log("a user disconnected");
    io.emit("user got disconnected", {
      name: socket.username,
    });
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
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
