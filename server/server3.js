//Imports
const express = require('express')
const socket = require('socket.io')
const app = express()
const server = app.listen(3000)
const io = socket(server)
const colors = require('colors')
const p2 = require('p2')
const foreach = require('foreach')

//Config file
let config = require('./config')

//Classes
let classes = require('./classes')

//letiables
let ships = [];
let currentPlayers = 0;
let world = new p2.World({ gravity: [0, 0] }); world.defaultContactMaterial.friction = 0;
let time = LOBBY_TIME;
let lobby = true;
let dust = [];
let clientDust = [];
let lasers = [];

console.log("Cosmic.io server. All right reserved".red);
app.use(express.static("local"));
console.log("Express loaded.".green);
game();

function game() {
    console.log("Loading game server");
    //Connecting
    io.sockets.on('connection', (sock) => {
        console.log("Player connected:" + sock.id);
        currentPlayers++;
        let playerShip = {
            id: currentPlayers,
            transform: new p2.Body({ mass: 5, position: [2, 4] }),
            heading: 0,
            health: STARTING_HP,
            username: '',
            score: 0,
            sockId: sock.id,
            alive: true,
            cooldown: 0,
            skinId: null,
            movement: { left: false, right: false, up: false, down: false, shoot: false }
        };
        playerShip.transform.addShape(new p2.Box({ width: 80, height: 240 }));
        world.addBody(playerShip.transform);
        ships.push(playerShip);
        syncUI();
        if (!lobby) sock.emit('cosmicDust',refreshClientDust());

        //Movement
        sock.on('movement', (data) => {
            shipBySocketId(sock.id).movement = data;
        });

        //Username
        sock.on("username", (data) => {
            shipBySocketId(sock.id).username = data;
        });

        //Skin
        sock.on("skin", (data) => {
            shipBySocketId(sock.id).skinId = data;
        });

        //Disconnect
        sock.on('disconnect', (data) => {
            ships.pop(shipBySocketId(sock.id));
            console.log('Player disconnected:' + sock.id);
        });
        
    });

    //Server loop
    let lastUpdateTime = (new Date()).getTime();
    setInterval(() => {
        //Delta time calc
        let currentTime = (new Date()).getTime();
        let deltaTime = currentTime - lastUpdateTime;
        update(deltaTime / 1000);
        lastUpdateTime = currentTime;
    }, SERVER_BEAT);

    //Physics loop
    setInterval(() => {

        // The step method moves the bodies forward in time.
        world.step(PHYSICS_TIMESTEP, PHYSICS_TIMESTEP, 5);

    }, PHYSICS_TIMESTEP);

    //Server sync loops
    setInterval(() => {
        syncUI();
    }, SYNC_UI);

    /*
       ("`-''-/").___..--''"`-._ 
   `6_ 6  )   `-.  (     ).`-.__.`) 
   (_Y_.)'  ._   )  `._ `. ``-..-`  
  _..`--'_..-_/  /--'_.' ,'  
(il),-''  (li),'  ((!.-'
It's a tigeeeeeeeeeeeeeeeeeeeeeeer
  _______
 /       \
|         | Byku
| Monster | Dupnij
|  Energy | Sobie
| Drink   | Monsterka
|         | *_* ~Tomana
\_________/
   */
    console.log("Server Ready!".green);
}

function shipBySocketId(sockId) {
    for (let i = 0; i < ships.length; i++) {
        if (ships[i].sockId == sockId) {
            return ships[i];
        }
    }
}

function update(deltaTime) {
    if (!lobby) {
        updatePosition(deltaTime);
        syncShips();
    }
    updateTime(deltaTime);
}

function updateTime(deltaTime) {
    time -= deltaTime;
    if (time < 0) {
        if (lobby) {
            time = GAME_TIME;
            lobby = !lobby;
            generateDust();
            console.log("Game started".yellow)
        }
        else {
            time = LOBBY_TIME;
            lobby = !lobby;
            console.log("Game ended".yellow)
        }
    }
}

function updatePosition(deltaTime) {
    for (let i = 0; i < ships.length; i++) {
        if (ships[i].movement.up) ships[i].transform.applyForceLocal([0, PHYSICS_FORCE * deltaTime]);
        if (ships[i].movement.down) ships[i].transform.applyForceLocal([0, PHYSICS_FORCE * deltaTime * -1]);
        if (ships[i].movement.left) ships[i].transform.angularVelocity = deltaTime * PHYSICS_ROTATION_FORCE * -1;
        if (ships[i].movement.right) ships[i].transform.angularVelocity = deltaTime * PHYSICS_ROTATION_FORCE;
        if (ships[i].movement.shoot) shotlaser(ships[i].transform.position[0],ships[i].transform.position[1],ships[i].transform.angle);
    }
}

function generateDust() {
    foreach(dust, (object, key, array) => {
        try{
        world.removeBody(dust.transform);
        }
        catch(e){}
    });
    for (let i = 0; i < AMOUNT_OF_DUST; i++) {
        let x = Math.random() * (500 * RENDER_SIZE - -500 * RENDER_SIZE) + -500 * RENDER_SIZE;
        let y = Math.random() * (500 * RENDER_SIZE - -500 * RENDER_SIZE) + -500 * RENDER_SIZE;
        let transform = new p2.Body({ mass: 0, position: [x, y] });
        transform.addShape(new p2.Circle({ sensor: true, radius: RENDER_SIZE }));
        transform.motionState = p2.Body.STATIC;
        dust[i] = { size: 15, transform: transform };
        world.addBody(dust[i].transform);
    }
    //Dust collision handling
    world.on('beginContact', (evt) => {
        onDustCollect(evt.bodyA, evt.bodyB);
    });

    clientDust = [];
    foreach(dust, (object, key, array) => {
        clientDust[key] = {
            size: object.size,
            x: object.transform.position[0],
            y: object.transform.position[1]
        }
    });
    io.sockets.emit('cosmicDust', clientDust)
}

function refreshClientDust()
{
    clientDust = [];
    foreach(dust, (object, key, array) => {
        clientDust[key] = {
            size: object.size,
            x: object.transform.position[0],
            y: object.transform.position[1]
        }
    });
    return clientDust;
}

function onDustCollect(body1,body2)
{
    //Try compare bodies, assuming 1st body is ship
    try {
        ships[findShipIdByTransform(body1)].score += 1;
        let index = findDustIdByTransform(body2);
        world.removeBody(dust[index].transform);
        dust.splice(index, 1);
        syncDustDelete(index);
    }
    catch (e) {
        //Assuming 2nd body is ship
        try {
            ships[findShipIdByTransform(body2)].score += 1;
            let index = findDustIdByTransform(body1);
            world.removeBody(dust[index].transform);
            dust.splice(index, 1);
            syncDustDelete(index);
        }
        catch (E) {
            //Assuming 1st budy is ship and 2nd laser

            //Assuming 2nd body is ship and 1st laser
            //Assuming that Nazim is gay
            //Nazim is gay ~yknomeh
            if(true)
                nazim.gay==true;
        }
    }
}

function shotlaser(x, y, heading) {
    let laser = {
        transform: new p2.Body({
            mass: 5,
            position: [x, y],
            angle: heading
        }),
    };
    laser.transform.addShape(new p2.Box({ width: 80, height: 240, sensor:true}));
    laser.transform.applyForce([0, PHYSICS_LASER_FORCE * deltaTime]);
    lasers.push(laser);
}

function findShipIdByTransform(transform) {
    for (let i = 0; i < ships.length; i++) {
        if (ships[i].transform == transform) return i;
    }
    throw "Zaraza! znowu nazima przechędożyło!";
}

function findDustIdByTransform(transform) {
    for (let i = 0; i < dust.length; i++) {
        if (dust[i].transform == transform) return i;
    }
    throw "Zaraza! znowu sie przechędożyło!";
}

function findLaserIdByTransform(transform) {
    for (let i = 0; i < lasers.length; i++) {
        if (laser[i].transform == transform) return i;
    }
    throw "Nazim is gay exception";
}

//Sync functions
/*              __
               / _)         
        .-^^^-/ /          
    __/       /              
    <__.|_|-|_|  
    
      /\_/\
    =( °w° )=
      )   (  //
     (__ __)//
*/

function syncUI() {
    io.emit('ui', { title: 'Cosmic.IO - Lobby', lobby: lobby, time: Math.floor(time) });
}

function syncShips() {
    let shipData = [];
    foreach(ships, (ship, key, array) => {
        let prepared = {
            x: ship.transform.position[0],
            y: ship.transform.position[1],
            heading: ship.transform.angle,
            health: ship.health,
            username: ship.username,
            score: ship.score,
            sockId: ship.sockId,
            skinId: ship.skinId
        }
        shipData[key] = prepared;
    });
    io.emit('ships', shipData);
}

function syncDustDelete(i) {
    io.emit('dustRemove', i);
}
