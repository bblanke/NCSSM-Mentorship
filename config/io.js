var io = require('socket.io')();

io.on('connection', function(socket){
  socket.emit('socketcreds', socket.id);
});

module.exports = io;
