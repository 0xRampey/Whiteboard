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
  console.log('a user connected');
  users.push(socket);
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
  socket.on('draw', function (data) {
    if (users.length > 1) {
      socket.broadcast.emit('draw', {
        message: data
      });
    } else {
      console.log("You're alone, sorry.")
    }
  });
  socket.on('file', function (data) {
    if (users.length > 1) {
      socket.broadcast.emit('file', {
        buffer: data['buffer'],
        type: data['type']
      });
    } else {
      console.log("You're alone, sorry.")
    }
  });
});
io.listen(app.listen(80));
