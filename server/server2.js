//Imports
const express = require('express')
const socket = require('socket.io')
const app = express()
const server = app.listen(3000)
const io = socket(server)
const colors = require('colors')

//Config file
let config = require('./config')

//Classes
let classes = require('./classes')

//Variables
let ships = [];
let weapon = [];
let dust = [];
let messages = [];
let spectators = [];
let disconnectALL = false;
let connected = 0;
let hubNgameData = {title: 'CosmicIO - Preparing match',hub: true,gate: true}

//Booting up server
console.log("Cosmic.io server. All right reserved");
app.use(express.static("local"));
console.log("Express loaded.".green);
startGame()

//Start game
function startGame() {
    hubGame(config.HUB_TIME).then(() => {
      hubNgameData = {
        title: 'CosmicIO - Game started',
        hub: false,
        gate: false
      }
      console.log('Game started'.green)
      gameTime(config.GAME_TIME).then(() => {
        disconnectALL = true;
      })
    })
}

//Sending data to clients
setInterval(hjerteslag,config.SERVER_BEAT);
function hjerteslag() {
  io.sockets.emit('hjerteslag', ships)
  io.sockets.emit('cosmicdust', dust)
  io.sockets.emit('weaponData', weapon)
  weapon = [];
  io.sockets.emit('messages', messages)
}

//Delete messages from chat
setInterval(deletemessages, 10*1000);
function deletemessages() {
  messages.pop();
}

//On connect
io.sockets.on('connection', (socket) => {
    //Welcome message
    console.log("Player connected ID:"+ socket.id);

    //Enable or disable specator mode
    if (!hubNgameData.gate) 
    {
      let hubOff = {
        spec: false
      }
      io.to(socket.id).emit('hubOff', hubOff)
    } 
    else 
    {
      let hubOff = {
        spec: true
      }
      io.to(socket.id).emit('hubOff', hubOff)
    }

    // Starting game
    socket.on('start', (shipData) => {
      console.log("X: " + shipData.x +
      ",\nY: " + shipData.y +
      ",\nSIZE: " + shipData.size +
      ",\nHEADING: " + shipData.heading +
      ",\nHEALTH: " + shipData.health
    )
    
    console.log('\n================')
    if (hubNgameData.gate) {
      ships.push(new classes.Ship(
        socket.id,
        shipData.x,
        shipData.y,
        shipData.size,
        shipData.heading,
        shipData.health,
        shipData.usrname,
        shipData.score
      ))
    } else {
      spectators.push(new classes.Spectator(socket.id))
    }
    })})

    //Countdown
    let countDown = (duration) => {
        let t = duration, minutes, seconds;
        setInterval(function () {
            minutes = parseInt(t / 60, 10);
            seconds = parseInt(t % 60, 10);
      
            let data = {
              minutes: minutes < 10 ? "0" + minutes : minutes,
              seconds:  seconds < 10 ? "0" + seconds : seconds
            }
            io.sockets.emit('time', data)
            io.sockets.emit('game', hubNgameData);
            if (--t < 0) {
              clearInterval(this)
            }
        }, 1000);
      }

    //Chuj wie co to robi
    function hubGame(t) {
        return new Promise(resolve => {
          console.log('Lobby time'.white)
          countDown(60 * t)
          setTimeout(resolve, t * 1000 * 60)
        });
      }
      
      function gameTime(t) {
        return new Promise(resolve => {
          countDown(60 * t)
          setTimeout(resolve, t * 1000 * 60)
        });
      }
