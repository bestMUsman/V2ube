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
      onReady: onPlayerReady,
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
  let namesOfRooms = data.namesOfRooms;
  let peopleCountInRoom = data.peopleCountInRoom;
  for (let key in namesOfRooms) {
    if (!namesOfRooms[key].sockets.hasOwnProperty(key)) {
      if (key !== "global") {
        let peopleCountForThisRoom = "";
        for (let newKey in peopleCountInRoom) {
          if (newKey == key) {
            peopleCountForThisRoom = peopleCountInRoom[newKey].people;
          }
        }
        containgRooms.unshift(
          `<li onclick="joiningNewRoom('${key}');">${key}  <div class="peopleCount"><img class="userIcon" src="images/userIcon.png" alt="user icon image"> ${peopleCountForThisRoom}</div></li>`
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
    $(".contactBttn").show();
    history.pushState(null, null, "/");
  } else {
    $(".youtubeSection").show();
    $(".showRoomsContainer").hide();
    $(".contactBttn").hide();
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

socket.on("send saved messages to single client", function(data) {
  const messages = document.querySelector("#messages");
  data = data.data;
  for (let i = 0; i < data.length; i++) {
    let li = document.createElement("li");
    li.innerHTML =
      "<span class='nameTagMessage'>" +
      data[i].name +
      "</span>: " +
      data[i].message;
    messages.appendChild(li);
  }

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

let firsTimeLoaded = true;
let oldOldState = "";
let oldState = "";
let playerIsReady = false;
let waitingForPlayerIsReady = false;
let videoUrl = "";
let toSingleClientOnly = false;
socket.on("sending url to everyone or to client", function(data) {
  toSingleClientOnly = data.toSingleClientOnly;
  if (playerIsReady && !toSingleClientOnly) {
    player.loadVideoById(data.url);
  } else if (playerIsReady && toSingleClientOnly) {
    firsTimeLoaded = false;
    player.loadVideoById(data.url);
    socket.emit("give me room video state and time");
  } else {
    // this means a user came directly by room url
    videoUrl = data.url;
    waitingForPlayerIsReady = true;
    firsTimeLoaded = false;
  }
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

socket.on(
  "give your room video state and time to everyone in room except sender",
  function() {
    sendNewTimeToServer();
  }
);

function onPlayerReady(event) {
  playerIsReady = true;
  // This is when someone comes on a website directly with the room url, so it waits for the player to get ready
  if (waitingForPlayerIsReady) {
    player.loadVideoById(videoUrl);
    if (toSingleClientOnly) {
      socket.emit("give me room video state and time");
    }
  }
}

function sendNewTimeToServer() {
  let currentTime = player.getCurrentTime();
  socket.emit("new time send to server", {
    time: currentTime,
    room: room,
  });
}

function onPlayerStateChange(event) {
  if (firsTimeLoaded == false) {
    // To change the time, when the video is paused and the the time is being changed so the other method doesn't work -- Pause and Play Method
    if (
      (oldState == 2 && event.data == 1) ||
      (oldOldState == 2 && event.data == 1)
    ) {
      let currentTime = player.getCurrentTime();
      if (currentTime != undefined) {
        sendNewTimeToServer();
      }
    } else if (event.data == 1) {
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
  oldOldState = oldState;
  oldState = event.data;
}

/* Contact Section Starts */
function showContactForm() {
  history.pushState(null, null, "/contact");
  $(".contactContainer").css("display", "flex");
  $(".contactInnerContainer").show().addClass("animatezoom");
}

$(".contactContainer").click(function(event) {
  if ($(event.target).is(":not(.contactContainer iframe *)")) {
    $(".contactContainer").hide();
    history.pushState(null, null, "/");
  }
});
/* Contact Section Starts */
