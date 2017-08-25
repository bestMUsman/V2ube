const express = require("express");
const socketIO = require("socket.io");
const path = require("path");
console.log("going to reset the roomsInfo");

let roomsInfo = {};
let savedMessages = {};

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

// var cb1 = function(req, res, next) {
//   res.send("hello", INDEX);
//   next();
// };

const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .use(express.static(path.join(__dirname, "public")))
  .get("/", function(req, res) {
    res.sendFile(INDEX);
  })
  .get("/contact", function(req, res) {
    res.sendFile(INDEX);
  })
  .get("/Roomname=:id", function(req, res) {
    res.sendFile(INDEX);
  })
  .get("*", function(req, res) {
    res.redirect("/");
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on("connection", function(socket) {
  /* User Connection/Disconnection Starts */
  console.log(
    "                                                                                                                                                                                                                                                      "
  );

  console.log("a user connected");

  socket.on("disconnect", function() {
    console.log("a user disconnected");
    console.log("socket.userRoom: ", socket.userRoom);

    deletePeopleInRoomInRoomsInfo(socket.userRoom);
    deleteMessagesInSavedMessagesObjIfRoomIsEmpty(socket.userRoom);
    io.sockets.in(socket.userRoom).emit("user got disconnected", {
      name: socket.username,
    });
    sendNewRoomData();
  });

  socket.on("user joined", function(data) {
    socket.username = data.name;
    io.sockets.in(socket.userRoom).emit("got new user", {
      name: socket.username,
    });
  });
  /* User Ends */

  /* Room Starts */

  // console.log("length of people on website: ", io.sockets.adapter.rooms);

  /* Manage Rooms Function Starts */

  function isThisRoomInRoomsInfo(roomName) {
    if (roomsInfo.hasOwnProperty(roomName) === false) {
      // console.log(roomsInfo[key])
      // console.log(false);
      return false;
    }
  }

  function addRoomInRoomsInfo(roomName) {
    if (roomsInfo[roomName] === undefined) {
      console.log("Adding room to RoomsInfo: ", roomName);
      roomsInfo[roomName] = {};
    } else {
      console.log("Didn't add Room b/c it was already there: ", roomName);
    }
  }

  function addPeopleInRoomInRoomsInfo(roomName) {
    console.log(
      "Adding People in: ",
      roomName,
      ", People Contains Before Adding: ",
      roomsInfo[roomName].people
    );

    if (isNaN(roomsInfo[roomName].people)) {
      console.log(
        "The Room.people was not already defined, that is why it came here"
      );

      roomsInfo[roomName].people = +1;
    } else {
      roomsInfo[roomName].people += 1;
    }
  }

  function deletePeopleInRoomInRoomsInfo(roomName) {
    if (roomsInfo[roomName] !== undefined) {
      console.log(
        "Deleting People From ",
        roomName,
        ", People Contains Before Deleting: ",
        roomsInfo[roomName].people
      );
      roomsInfo[roomName].people -= 1;
    }
  }

  function addUrlToRoomInRoomsInfo(roomName, urlLink) {
    roomsInfo[roomName].url = urlLink;
  }

  function deleteRoomInRoomsInfoIfEmpty(roomName) {
    if (roomsInfo[roomName] !== undefined) {
      if (roomsInfo[roomName].people == 0) {
        console.log(
          "Deleting Room: ",
          roomName,
          " People Contains: ",
          roomsInfo[roomName].people
        );
        delete roomsInfo[roomName];
      }
    }
  }
  /* Manage Rooms Function Ends */

  function sendNewRoomData() {
    io.sockets.emit("rooms count", {
      namesOfRooms: io.sockets.adapter.rooms,
      peopleCountInRoom: roomsInfo,
    });
  }

  function keepSavedMessages(room, userName, msg) {
    if (!Array.isArray(savedMessages[room])) {
      savedMessages[room] = [];
    }
    savedMessages[room].push({ name: [userName], message: msg });
    if (savedMessages[room].length > 10) {
      savedMessages[room].shift();
    }
  }

  function deleteMessagesInSavedMessagesObjIfRoomIsEmpty(roomName) {
    if (roomsInfo[roomName] == undefined && roomName !== "global") {
      delete savedMessages[roomName];
    }
  }

  function sendSavedMessagesToClient(socketId, roomName) {
    if (savedMessages.hasOwnProperty(roomName)) {
      io.sockets.to(socketId).emit("send saved messages to single client", {
        data: savedMessages[roomName],
      });
    }
  }

  socket.on("room", function(room) {
    // console.log("this is the socketid of this user: socket.id", socket.id);

    socket.userRoom = room; // Setting up new room for the session of user

    if (isThisRoomInRoomsInfo(room) === false) {
      addRoomInRoomsInfo(room);
    }
    addPeopleInRoomInRoomsInfo(room);
    console.log("LINE 123 RoomsInfo Obj: ", roomsInfo);

    if (Object.keys(io.sockets.adapter.sids[socket.id]).length >= 2) {
      let OldRoom = socket.rooms[Object.keys(socket.rooms)[1]];
      deletePeopleInRoomInRoomsInfo(OldRoom);
      deleteRoomInRoomsInfoIfEmpty(OldRoom);
      deleteMessagesInSavedMessagesObjIfRoomIsEmpty(OldRoom);
      socket.leave(OldRoom); // Leaving the old room
      console.log("OLD ROOM: ", OldRoom);
    }
    socket.join(room); // Joining the new room
    // console.log("Listing All Rooms: " + io.sockets.adapter.rooms);
    sendSavedMessagesToClient(socket.id, room);
    sendNewRoomData();
    // console.log("socket.userRoom: ", socket.userRoom);
    // console.log("roomsInfo[socket.userRoom]: ", roomsInfo[socket.userRoom]);

    if (room !== "global") {
      console.log("roomsInfo Obj: ", roomsInfo);

      if (
        roomsInfo[socket.userRoom].url !== "" &&
        roomsInfo[socket.userRoom].url !== undefined
      ) {
        console.log(
          "roomsInfo[socket.userRoom].url: ",
          roomsInfo[socket.userRoom].url
        );
        console.log("it should send url to the specifi person now");
        let videoUrl = roomsInfo[socket.userRoom].url;

        socket.emit("sending url to everyone or to client", {
          url: videoUrl,
          toSingleClientOnly: true,
        });
      }
    } else {
      socket.emit("sending url to everyone or to client", {
        url: "",
        toSingleClientOnly: true,
      });
    }
  });

  /* Room Ends */

  /* User Joins Through Url Starts */

  socket.on("give me room video state and time", function() {
    socket
      .to(socket.userRoom)
      .emit(
        "give your room video state and time to everyone in room except sender"
      );
  });
  /* User Joins Through Url Ends */

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
    keepSavedMessages([socket.userRoom], [socket.username], data.msg);
    // console.log("savedMessages: ", savedMessages);

    // savedMessages[socket.userRoom].push("sdfdsfds");
    console.log(data.msg);
    io.sockets.in(socket.userRoom).emit("new message", {
      msg: data.msg,
      name: socket.username,
    });
  });
  /* Chat Ends in Server */
  /* Youtube Section Starts in Server */
  socket.on("sending url to server", function(data) {
    // roomsInfo[socket.userRoom] = data.url;
    if (!isThisRoomInRoomsInfo(socket.userRoom)) {
      addRoomInRoomsInfo(socket.userRoom);
    }
    addUrlToRoomInRoomsInfo(socket.userRoom, data.url);
    console.log("this is rooms Info object: ", roomsInfo);

    // console.log('second one ', data.url);
    io.sockets
      .in(socket.userRoom)
      .emit("sending url to everyone or to client", {
        url: data.url,
      });
    // console.log(socket.userRoom);
    // console.log(roomsInfo);
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
