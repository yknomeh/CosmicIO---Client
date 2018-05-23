//Imports
const express = require('express')
const socket = require('socket.io')
const app = express()
const server = app.listen(3000)
const io = socket(server)
const colors = require('colors')
const p2 = require('p2')
//Config file
let config = require('./config')

//Classes
let classes = require('./classes')

//Variables
let ships = [];
let currentPlayers = 0;
let world = new p2.World({gravity : [0, 0]}).defaultContactMaterial.friction = 0;

console.log("Cosmic.io server. All right reserved");
app.use(express.static("local"));
console.log("Express loaded.".green);
game();

function game()
{
    console.log("Loading game server");
    //Conncting
    io.sockets.on('connection',function(sock)
    {
        console.log("Player connected:"+sock.id);
        currentPlayers++;
        let playerShip = {
            id:currentPlayers,
            transform: new p2.Body({mass: 5,position: [0,0]}).addShape(p2.Circle,{radius:5}),
            heading:0,
            health:config.STARTING_HP,
            username:'',
            score:0,
            sockId:sock.id,
            movement:{left:false,right:false,up:false,down:false}
        };
        world.addBody(playerShip.transform);
        ships.push(playerShip);
        io.to(playerShip.sockId).emit('playable',true);
    });

    //Movement
    io.sockets.on('movement',function(sock)
    {
        shipBySocketId(sock.id).movement = sock;
    });

    //Enter game
    //io.sockets.on("enterGame");

    //Server loop
    var lastUpdateTime = (new Date()).getTime();
    setInterval(function() {
        //Delta time calc
        var currentTime = (new Date()).getTime();
        var deltaTime = currentTime - lastUpdateTime;
        update(deltaTime);
        lastUpdateTime = currentTime;
      },
      config.SERVER_BEAT);

    //Physics loop
    setInterval(function(){
 
        // The step method moves the bodies forward in time.
        world.step(1000/50);

     
    }, 1000/50);
}

function shipBySocketId(sockId)
{
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].sockId == sockId) {
            return ships[i];
        }
    }
}

function update(deltaTime)
{
    updatePosition(deltaTime);
}

function updatePosition(deltaTime)
{
    for (var i = 0; i < ships.length; i++) {
        if(ships[i].movement.up)ships[i].transform.applyForceLocal([0,120*deltaTime]);
        if(ships[i].movement.down)ships[i].transform.applyForceLocal([0,120*deltaTime*-1]);
        if(ships[i].movement.left)ships[i].transform.angularVelocity = deltaTime * -10;
        if(ships[i].movement.right)ships[i].transform.angularVelocity = deltaTime * 10;
    }
}