

var express = require('express');
var app = express();
var serv = require('http').Server(app);
 
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
 
serv.listen(2000);
console.log("Server started.");
 
var SOCKET_LIST = [];
var PLAYER_LIST = [];
var PARTNERS_LIST = []; 

var Player = function(id){
    var self = {
        x:250,
        y:250,
        id:id,
        number:"" + Math.floor(10 * Math.random()),
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxSpd:10,
    }
    self.updatePosition = function(){
        if(self.pressingRight)
            self.x += self.maxSpd;
        if(self.pressingLeft)
            self.x -= self.maxSpd;
        if(self.pressingUp)
            self.y -= self.maxSpd;
        if(self.pressingDown)
            self.y += self.maxSpd;
    }
    return self;
}

class Pack {
    constructor(socket1, player1){
        this.Socket = socket1;
        this.Player = player1;
    }

    get socket(){
        return this.Socket;
    }

    get player(){
        return this.Player;
    }
}

class Partner {
    constructor(pack1, pack2){
        this.pack1 = pack1;
        this.pack2 = pack2;
    }

    get Pack1(){
        return this.pack1;
    }

    get Pack2(){
        return this.pack2;
    }

    set Pack1(value) {
        this._pack1 = value;
    }

    set Pack2(value1) {
        this._pack2 = value1;
      }

    delpack1(){
        this._pack1 = null;
    }

    delpack2(){
        this._pack2 = null;
    }
   
}
 
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = SOCKET_LIST.length;
    var partnerId;
    var numPack;
    SOCKET_LIST[socket.id] = socket;
 
    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    newPack = new Pack(socket, player);


    var last_element = PARTNERS_LIST[PARTNERS_LIST.length - 1];
    if (last_element== null){
        PARTNERS_LIST[0] = new Partner(newPack, null);
        partnerId = 0;
        numPack = 0;
    }
    else if (last_element.Pack2 == null){
        PARTNERS_LIST[PARTNERS_LIST.length-1].pack2 = newPack;
        partnerId = PARTNERS_LIST.length-1;
        numPack = 1;
    }
    else {
        PARTNERS_LIST[PARTNERS_LIST.length] =new Partner(newPack, null);
        partnerId = PARTNERS_LIST.length;
        numPack = 0;
    }

   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        if (numPack==0){
            PARTNERS_LIST[partnerId].pack1 = null;
        }
        if (numPack==1){
            PARTNERS_LIST[partnerId].pack2 = null;
        }
        
        
    });
   
    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });
   
   
});
 
setInterval(function(){
    for(var i in PARTNERS_LIST){
        if (PARTNERS_LIST[i] != null){
            pack = [];
            if (PARTNERS_LIST[i].Pack1 != null){
                var player1 = PARTNERS_LIST[i].Pack1;
                player1.player.updatePosition();
                pack.push({
                    x:player1.player.x,
                    y:player1.player.y,
                    number:player1.player.number
                        
                })
            }
            if (PARTNERS_LIST[i].Pack2 != null){
                var player2 = PARTNERS_LIST[i].Pack2;
                player2.player.updatePosition();
                pack.push({
                    x:player2.player.x,
                    y:player2.player.y,
                    number:player2.player.number
                })
            }   
            if ( PARTNERS_LIST[i].Pack1 != null){
                player1.socket.emit('newPositions',pack)
            }      
            if (PARTNERS_LIST[i].Pack2 != null){
                player2.socket.emit('newPositions',pack)
            } 
        }    
    }  
},1000/25);
 