var static = require('node-static');
var http = require('http');
var fs = require('fs');
var app = null;
var path = require('path');

var server_handler = function (req, res) {
	  res.writeHead(404);
        res.end();
    }
var file = new(static.Server)();
var app = require('https').Server({
        key: fs.readFileSync('config/sslcerts/key.pem'),
        cert: fs.readFileSync('config/sslcerts/cert.pem'),
        passphrase: null
    }, server_handler);
app.listen(8080);

var io = require('/var/www/html/videochat/node_modules/socket.io')(app);



io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (data) {
		log('Got message: ', data.message);
    // For a real app, should be room only (not broadcast)
    var room = data.room;
		socket.broadcast.to(room).emit('message', data.message);
	});

	socket.on('create or join', function (room) {
		function findClientsSocket(roomId, namespace) {
					    var res = []
					    , ns = io.of(namespace ||"/");    // the default namespace is "/"

					    if (ns) {
					        for (var id in ns.connected) {
					            if(roomId) {
					                var index = ns.connected[id].rooms.indexOf(roomId) ;
					                if(index !== -1) {
					                    res.push(ns.connected[id]);
					                }
					            } else {
					                res.push(ns.connected[id]);
					            }
					        }
					    }
					    return res;
					}
		var numClients = findClientsSocket(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});

});