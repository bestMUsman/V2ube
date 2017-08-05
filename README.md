
**Live**: http://www.v2ube.com/

Welcome to V-Tube!
===================

### What does it do?  
An app which allows people to create different rooms where people can chat in real-time. It also allows users to enter the video url and watch videos together with synchronize functionality. It also allow users to pause, play, and move the video time forward and backward for everyone in the room, enabling everyone in the room to experience the same video scene together.
                                            
### How to use it?  
 - Go to the website 
 - Click on Create Room Button
 - Enter the Room Name and Video Url
 - Share the Room Url with your friends
 - Your friends join the room then you watch video and chat together

### How does it work? 
 - When user vists a website, so he/she is given a default room using socket.
 - User joins a room, which creates a new property in a room object to keep the track of the room info. 
 - Room info includes: People in room, Video url of the Room, Still Open or Close, Count of People.
 - When user clicks on pause, play, or move the video forward or backwards so the state changes of youtube video.
 - Each time when something is done with so a video state changes, which is detected by Youtbe API.
 - Each time Youtube API detects new state, so new video time for that room is sent to the server from that user using socket. 
 - Server, using node.js/express then sends that time to everyone in that specific room using socket, which enables the synchronize functionality.
 - Allowing People to pause, play, and move video forward and backward for everyone.

### What techs are used? 
 - Node.js/Express
 - Socket.io
 - Javascript
 - DOM
 - Youtube API


![alt text](https://github.com/askflow1111/V2ube/blob/master/vtube.png?raw=true)
