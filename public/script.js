var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "749",
    // playerVars: { 'autoplay': 0, },
    playerVars: {
      rel: 0
    },
    videoId: "",
    events: {
      // 'onReady': onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

var socket = io();

/* Room Starts */

// When user comes to website so user joins the room by default
let room = "global";
socket.on("connect", function() {
  socket.emit("room", room);
});

// Counting Rooms
let roomsOpen = document.getElementById("roomsOpen");
socket.on("rooms count", function(data) {
  let containgRooms = "";
  for (var key in data) {
    if (!data[key].sockets.hasOwnProperty(key)) {
      // console.log(key);
      if (key !== "global") {
        containgRooms += `<li onclick="joiningNewRoom('${key}');">${key}</li>'`;
      }
    }
  }
  roomsOpen.innerHTML = containgRooms;
  $(".showRoomsContainer ul").html($("ul").find("li").get().reverse());
  $(".showRoomsContainer").append(
    '<div class="addRoomBttn"  onclick="showAddRoomModule()">+</div>'
  );
});

// When a user submits 'creates new room' form
$(".addingRoomContainer form").submit(function() {
  joiningNewRoom($(".addingRoomContainer #name").val());
  loadVideoByUrl("addingRoomContainer");
  $(".addingRoomContainer #name").val("");
  return false;
});

// When a user changes the video Url
$(".changeVideoUrlContainer form").submit(function() {
  loadVideoByUrl("changeVideoUrlContainer");
  return false;
});

// When a user joins a new room
function joiningNewRoom(roomName) {
  room = roomName;
  // console.log("about to join " + roomName);
  if (roomName == "global") {
    $(".youtubeSection").hide();
    $(".showRoomsContainer").show();
  } else {
    $(".youtubeSection").show();
    $(".showRoomsContainer").hide();
    // let messages = document.getElementById("messages");
    // messages.innerHTML = '';
  }
  socket.emit("room", roomName);
}
/* Room Ends */

/* Adding Room Module Starts */
// let showingModule = false;
function showAddRoomModule() {
  $(".addingRoomContainer").css("display", "flex");
  $(".addingRoomInnerContainer").show().addClass("animatezoom");
  // showingModule = true;
}
// $(".addingRoomContainer").show().addClass("animatezoom");

$(".addingRoomContainer").click(function(event) {
  // console.log(event.target);
  if ($(event.target).is(":not(.addingRoomContainer *, .addRoomBttn)")) {
    // console.log("working");
    // if (showingModule) {
    $(".addingRoomContainer").hide();
    // }
  }
});

/* Adding Room Module Ends */

/* Changing Video Url Module Starts */
// let showingVideoUrlModule = false;
function showChangeVideoUrlModule() {
  $(".changeVideoUrlContainer").css("display", "flex");
  $(".changeVideoUrlInnerContainer").show().addClass("animatezoom");
  // showingVideoUrlModule = true;
}

$(".changeVideoUrlContainer").click(function(event) {
  // console.log('working haha');
  if (
    $(event.target).is(":not(.changeVideoUrlContainer *, .switchUrlArrows)")
  ) {
    // console.log("ANOTHER working");
    // if (showingVideoUrlModule) {
    $(".changeVideoUrlContainer").hide();
    // }
  }
});
/* Changing Video Url Module Ends */

/* Chat Section Starts in Script */
$("#chatContainer form").submit(function() {
  let chatMessage = $("#m").val();
  socket.emit("chat message", {
    msg: chatMessage,
    room: room
  });
  $("#m").val("");
  return false;
});

socket.on("new message", function(data) {
  $("#messages").append(
    "<li><span class='nameTagMessage'>" +
      data.name +
      "</span>" +
      ": " +
      data.msg +
      "</li>"
  );
  $("#messages").animate({
    scrollTop: $("#messages").get(0).scrollHeight
  });
});

$("#setNameContainer form").submit(function() {
  socket.emit("user joined", {
    name: $("#setNameBox").val(),
    room: room
  });
  $("#setNameBox").val("");
  $("#setNameContainer").hide();
  // $("#chatContainer").show();
  return false;
});

socket.on("got new user", function(data) {
  $("#messages").append(
    "<li class='nameTagJoinedOrLeft'>" +
      "<span class='nameTag'>" +
      data.name +
      "</span>" +
      " has joined the chat!" +
      "</li>"
  );
  $("#messages").animate({
    scrollTop: $("#messages").get(0).scrollHeight
  });
});

socket.on("user got disconnected", function(data) {
  if (data.name != undefined) {
    $("#messages").append(
      "<li class='nameTagJoinedOrLeft'>" +
        "<span class='nameTag'>" +
        data.name +
        "</span>" +
        " has left the chat!" +
        "</li>"
    );
    $("#messages").animate({
      scrollTop: $("#messages").get(0).scrollHeight
    });
  }
});
/* Chat Section Ends in Script */

/* Youtube Section Starts in Script  */
// This sends the url to server when a user submit the form

function loadVideoByUrl(containerName) {
  $(`.${containerName}`).hide();

  // console.log("the whole url => ", $("#submitUrl").val());
  let url = $(`.${containerName} #url`)
    .val()
    .split("https://www.youtube.com/watch?v=")
    .pop()
    .trim();
  socket.emit("sending url to server", {
    url: url,
    room: room
  });
  $(`.${containerName} #url`).val("");
  return false;
}

var firsTimeLoaded = true;
let oldOldState = "";
let oldState = "";

socket.on("sending url to everyone", function(data) {
  // console.log("url id=>", data.url);
  player.loadVideoById(data.url);
});

socket.on("playing video for everyone", function() {
  player.playVideo();
});

socket.on("pausing video for everyone", function() {
  player.pauseVideo();
});

socket.on("send this time to everyone", function(time) {
  if (time.time != undefined) {
    // console.log(
    //   "PRINT THE CURRENT TIME ONLY WHEN IT IS NOT UNDEFINED ",
    //   time.time
    // );
    player.seekTo(time.time, true);
    player.playVideo();
  }
});

// function onPlayerReady(event) {
//   console.log('this is workin inside onplayerready');
// }

function onPlayerStateChange(event) {
  // console.log("State Change => ", event.data);
  if (firsTimeLoaded == false) {
    // To change the time, when the video is paused and the the time is being changed so the other method doesn't work -- Pause and Play Method
    if (
      (oldState == 2 && event.data == 1) ||
      (oldOldState == 2 && event.data == 1)
    ) {
      // console.log("sending time using pause and play method");
      let currentTime = player.getCurrentTime();
      if (currentTime != undefined) {
        socket.emit("new time send to server", {
          time: currentTime,
          room: room
        });
      }
    } else if (event.data == 1) {
      // To change the video time for everyone -- using buffer method
      // else if (event.data == 3 && firsTimeLoaded == false) {
      //   console.log('now it is time to get new time');
      //   let currentTime = player.getCurrentTime();
      //   if (currentTime != undefined) {
      //     socket.emit("new time send to server", {
      //       time: currentTime,
      //       room: room,
      //     });
      //   }
      // }

      // To play the video for everyone
      socket.emit("play video now to server", room);
    }

    // To pause the video for everyone
    if (event.data == 2) {
      socket.emit("pause video now to server", room);
    }
  }

  // To Stop Video In the Beggining
  if (event.data == 1 && firsTimeLoaded == true) {
    // console.log("firsTimeLoaded ", firsTimeLoaded);
    player.stopVideo();
    firsTimeLoaded = false;
    // console.log("firsTimeLoaded ", firsTimeLoaded);
    // console.log("=====================");
  }

  // if (event.data == YT.PlayerState.PLAYING && !done) {
  //   setTimeout(stopVideo, 6000);
  //   done = true;
  // }
  oldOldState = oldState;
  oldState = event.data;
}
