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
      rel: 0,
    },
    videoId: "",
    events: {
      // 'onReady': onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

var socket = io();

/* Room Starts */
// When user comes to website so user joins the room by default
let room = "global";
socket.on("connect", function() {
  getUrl();
});

function getUrl() {
  let url = window.location.pathname;
  url = url.split("/Roomname=").pop().trim();

  if (url !== "/") {
    room = url;
  } else {
    room = "global";
  }
  joiningNewRoom(room);
}

window.onpopstate = function(event) {
  getUrl();
};

// Counting Rooms
let roomsOpen = document.getElementById("roomsOpen");
socket.on("rooms count", function(data) {
  let containgRooms = [];
  let containgRoomsAsString = "";
  for (var key in data) {
    if (!data[key].sockets.hasOwnProperty(key)) {
      if (key !== "global") {
        containgRooms.unshift(
          `<li onclick="joiningNewRoom('${key}');">${key}</li>`
        );
      }
    }
  }
  containgRooms.forEach(function(element) {
    containgRoomsAsString += element;
  });
  roomsOpen.innerHTML = containgRoomsAsString;
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
  if (roomName == "global") {
    $(".youtubeSection").hide();
    $(".showRoomsContainer").show();
    history.pushState(null, null, "/");
  } else {
    $(".youtubeSection").show();
    $(".showRoomsContainer").hide();
    history.pushState(null, null, "/Roomname=" + room);
  }
  messages.innerHTML = "";
  socket.emit("room", roomName);
}
/* Room Ends */

/* Adding Room Module Starts */
function showAddRoomModule() {
  $(".addingRoomContainer").css("display", "flex");
  $(".addingRoomInnerContainer").show().addClass("animatezoom");
}

$(".addingRoomContainer").click(function(event) {
  if ($(event.target).is(":not(.addingRoomContainer *, .addRoomBttn)")) {
    $(".addingRoomContainer").hide();
  }
});

/* Adding Room Module Ends */

/* Changing Video Url Module Starts */
function showChangeVideoUrlModule() {
  $(".changeVideoUrlContainer").css("display", "flex");
  $(".changeVideoUrlInnerContainer").show().addClass("animatezoom");
}

$(".changeVideoUrlContainer").click(function(event) {
  if (
    $(event.target).is(":not(.changeVideoUrlContainer *, .switchUrlArrows)")
  ) {
    $(".changeVideoUrlContainer").hide();
  }
});
/* Changing Video Url Module Ends */

/* Chat Section Starts in Script */
$("#chatContainer form").submit(function() {
  let chatMessage = $("#m").val();
  socket.emit("chat message", {
    msg: chatMessage,
    room: room,
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
    scrollTop: $("#messages").get(0).scrollHeight,
  });
});

$("#setNameContainer form").submit(function() {
  socket.emit("user joined", {
    name: $("#setNameBox").val(),
    room: room,
  });
  $("#setNameBox").val("");
  $("#setNameContainer").hide();
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
    scrollTop: $("#messages").get(0).scrollHeight,
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
      scrollTop: $("#messages").get(0).scrollHeight,
    });
  }
});
/* Chat Section Ends in Script */

/* Youtube Section Starts in Script  */
// This sends the url to server when a user submit the form
function loadVideoByUrl(containerName) {
  $(`.${containerName}`).hide();
  let url = $(`.${containerName} #url`)
    .val()
    .split("https://www.youtube.com/watch?v=")
    .pop()
    .trim();
  socket.emit("sending url to server", {
    url: url,
    room: room,
  });
  $(`.${containerName} #url`).val("");
  return false;
}

var firsTimeLoaded = true;
let oldOldState = "";
let oldState = "";

socket.on("sending url to everyone", function(data) {
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
          room: room,
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
    player.stopVideo();
    firsTimeLoaded = false;
  }

  // if (event.data == YT.PlayerState.PLAYING && !done) {
  //   setTimeout(stopVideo, 6000);
  //   done = true;
  // }
  oldOldState = oldState;
  oldState = event.data;
}
