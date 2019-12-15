var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

  console.log('NEW CONNECTION');

  socket.on('offer', function (data) {
    console.log(data);
    socket.broadcast.emit("offer", data);
  });

  socket.on('answer', function (data) {
    console.log(data);
    socket.broadcast.emit("answer", data);
  });

  socket.on('candidate', function (data) {
    console.log(data);
    socket.broadcast.emit("candidate", data);
  });
});

server.listen(3000, function () {
  console.log('listening on *: 3000');
});