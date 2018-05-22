const express = require('express')
const socket = require('socket.io')
const app = express()

const server = app.listen(3000)
const io = socket(server)

/* CONFIG */
const SERVER_BEAT = 10; /* refreshing per ms */

const RENDER_SIZE = 5; /* size of dust rendering */
const AMOUNT_OF_DUST = 500; /* amount of dust */

const HUB_TIME = 1; /* lobby/hub time */
const GAME_TIME = 5; /* game time */
/* END of CONFIG */

let ships = [];
let weapon = [];
let dust = [];

let messages = [];

let spectators = [];

let disconnectALL = false;

let hubNgameData = {
  title: 'CosmicIO - Preparing match',
  hub: true,
  gate: true
}

let infoAlert = {
  message: '',
  duration: 0
}


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

function hubGame(t) {
  return new Promise(resolve => {
    console.log('\n\n-=NEW GAME=-')
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

function startGame() {
  hubGame(HUB_TIME).then(() => {
    hubNgameData = {
      title: 'CosmicIO - Game started',
      hub: false,
      gate: false
    }
    console.log('\n\n-=GAME HAS STARTED=-')
    gameTime(GAME_TIME).then(() => {
      disconnectALL = true;
    })
  })
}

function findShip(id) {

  for (var i = 0; i < ships.length; i++) {
      if (ships[i].id == id) {
          return i;
      }
  }
  
  return -1;
}

class Ship {
  constructor(id, x, y, s, heading, health, usrnm, score) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = s;
    this.heading = heading;
    this.health = health;
    this.username = usrnm;
    this.score = score;
  }
}

class Weapon {
  constructor(id, x, y, h) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.heading = h;
  }
}

class Dust {
  constructor(s, x, y) {
    this.x = x;
    this.y = y;
    this.size = s;
  }
}

class Spectator {
  constructor(id) {
    this.id = id;
  }
}

class Message {
  constructor(m) {
      this.message = m;
  }
}


app.use(express.static('local'))

console.log("Server is running!")

// Starting game
startGame()

setInterval(hjerteslag, SERVER_BEAT);
function hjerteslag() {
  io.sockets.emit('hjerteslag', ships)
  io.sockets.emit('cosmicdust', dust)
  io.sockets.emit('weaponData', weapon)
  weapon = [];
  io.sockets.emit('messages', messages)
}

setInterval(deletemessages, 10*1000);
function deletemessages() {
  messages = [];
}

let connected = 0;
io.sockets.on('connection', (socket) => {
  // Welcome message
  console.log('\n' + (connected++) + ')')
  console.log('================')
  console.log('-New Connection-')
  console.log('================')
  console.log('\nID: ' + socket.id + ',')
  if (!hubNgameData.gate) {
    let hubOff = {
      spec: false
    }
    io.to(socket.id).emit('hubOff', hubOff)
  } else {
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
    ships.push(new Ship(
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
    spectators.push(new Spectator(socket.id))
  }
  })

  // Updating game
  let old_pos_x;
  let old_pos_y;
  let old_size;
  let playerShip;

  alert('elo',5);

  socket.on('update', (shipData) => {

    if (disconnectALL) {
      disconnectALL = false;
      hubNgameData = {
        title: 'CosmicIO - Preparing match',
        hub: true,
        gate: true
      }
      socket.disconnect(true);
      startGame()
    }


    if (old_pos_x != undefined) {
      old_pos_x = shipData.x - old_pos_x > 20 || -(shipData.x - old_pos_x) > 20 ? console.log(socket.id + " is using cheats") : shipData.x;
    } else {
      old_pos_x = shipData.x;
    }
    if (old_pos_y != undefined) {
      old_pos_y = shipData.y - old_pos_y > 20 || -(shipData.y - old_pos_y) > 20 ? console.log(socket.id + " is using cheats") : shipData.y;
    } else {
      old_pos_y = shipData.y;
    }
    if (old_size != undefined) {
      old_size= shipData.size - old_size > 5 || -(shipData.size - old_size) > 5 ? console.log(socket.id + " is using cheats") : shipData.size;
    } else {
      old_size = shipData.size;
    }


    for (let i = 0; i < ships.length; i++) {
      if (socket.id == ships[i].id) {
        playerShip = ships[i];
      }
    }

    try {
      playerShip.x = shipData.x;
      playerShip.y = shipData.y;
      playerShip.size = shipData.size;
      playerShip.heading = shipData.heading;
      playerShip.health = shipData.health;
      playerShip.username = shipData.usrname;
      playerShip.score = shipData.score;

      if (playerShip.health <= 0) {
        // Player is dead
        messages.push(new Message('Player ' + ships[findShip(socket.id)].username + ' has been killed.'))
        ships.splice(findShip(socket.id), 1)
      }
    } catch (e) {

    }

  })
  socket.on('health', (data) => {
    if(playerShip.health <= data.damage) {
      playerShip.health += data.damage;
      ships[findShip(data.shoter)].score += 50;
    } else {
      playerShip.health += data.damage;
    }
    io.sockets.emit('weaponDelete', data.splice)
  })

  socket.on('weapon', (data) => {
    weapon.push(new Weapon(socket.id, data.x, data.y, data.heading))
  })

  socket.on('updatedust', (data) => {
    dust.splice(data, 1)
  })

  socket.on('addpoints', (data) => {
    let ship = ships[findShip(socket.id)];
    ship.score += data;
    ship.size ++;
    ship.health *= 1.1;
  })

  socket.on('message', (data) => {
    messages.push(new Message(data))
  })

  socket.on('disconnect', () => {
    console.log('\n' + (--connected) + ')')
    console.log('================')
    console.log('--Disconnected--')
    console.log('================')
    console.log("\nID: " + socket.id)
    
    if (findShip(socket.id) === -1) {
      console.log('\n-=SPECTATOR=-')
    } else {
      ships.splice(findShip(socket.id), 1)
    }

    console.log('\n================')
  })
})


for (let i = 0; i < AMOUNT_OF_DUST; i++) {
  let x = Math.random() * (500 * RENDER_SIZE - -500 * RENDER_SIZE) + -500 * RENDER_SIZE;
  let y = Math.random() * (500 * RENDER_SIZE - -500 * RENDER_SIZE) + -500 * RENDER_SIZE;
  dust[i] = new Dust(15, x, y);
}

function alert(contents,duration)
{
    socket.emit('alert',infoAlert={message:contents,duration: duration});
}