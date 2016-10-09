var app = require('express')();
var express = require('express');
var io = require('socket.io')(http);
var http = require('http').Server(app);
var users = [];
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname));
io.on('connection', function (socket) {
  if (users.length < 2) {
    console.log('a user connected');

    users.push(socket);
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
    socket.on('draw', function (data, type) {
      if (users.length == 2) {
        //send to other socket
        if (users[0] != socket) {
          users[0].emit('draw', {
            message: data,
            type: type
          });
        } else {
          users[1].emit('draw', {
            message: data,
            type: type
          });
        }
      } else {
        console.log("You're alone, sorry.")
      }
    });
    socket.on('file', function (data) {
      if (users.length == 2) {
        //send to other socket
        if (users[0] != socket) {
          users[0].emit('file', {
            buffer: data['buffer'],
            type: data['type']
          });
        } else {
          users[1].emit('file', {
            buffer: data['buffer'],
            type: data['type']
          });
        }
      } else {
        console.log("You're alone, sorry.")
      }
    });
  } else {
    console.log('Room full bitch.');
  }
});
io.listen(app.listen(2000));
