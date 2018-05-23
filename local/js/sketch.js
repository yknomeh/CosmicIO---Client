let socket;

let ship;
let ships = [];
let dust = [];
let dustData = [];
let moon = [];
let weapon = [];

let leaderboard = [];
let messageboard = [];

let scr = 0;

let alert = {
  message: 'test2',
  duration: 1
};

const RENDER_SIZE = 5;
const WEAPON_VELOCITY = 25;
const AMOUNT_OF_DUST = 1000;
const AMOUNT_OF_MOONS = 10;
const TEXT_SIZE = 18;

let zoom = 1;
let timer = "NaN:NaN";

let usrInput;
let username = " ";

let _hub = true;
let _canPlay = true;

let _debugger = false;

let skinImg;

function preload() {
  skinImg = loadImage('./images/skins/skin.png')
}

function setup() {
  createCanvas(
    window.innerWidth,
    window.innerHeight
  );

  ship = new Ship(60, 0, 0, RENDER_SIZE, skinImg);

  // Connection
  socket = io.connect('http://' + window.location.hostname + ':3000');

  socket.on('connect', function () {
    socket.on('hubOff', (data) => {
      _canPlay = data.spec;
    });
  });

  socket.on('disconnect', function () {
    window.location.reload();
  });

  socket.on('alert', function (alertdata) {
    alert = alertdata;
  })

  let shipData = {
    x: ship.pos.x,
    y: ship.pos.y,
    heading: ship.heading,
    size: ship.size,
    health: ship.health,
    usrname: username,
    score: 0
  }

  socket.emit('start', shipData);

  socket.on('hjerteslag', (data) => {
    ships = data;
    leaderboard = data;
    leaderboard.sort((a, b) => {
      return b.score - a.score
    });
  });

  socket.on('cosmicdust', (data) => {
    if (dust.length != data.length) {
      dust = [];
      for (let i = 0; i < data.length; i++) {
        dust[i] = new CosmicDust(data[i].size, data[i].x, data[i].y);
      }
    }
    dustData = data;
  });

  socket.on('weaponData', (data) => {
    for (let i = data.length - 1; i >= 0; i--) {
      let pos = createVector(data[i].x, data[i].y);
      weapon.push(new Weapon(data[i].id, pos, data[i].heading, WEAPON_VELOCITY));
    }

  });

  socket.on('weaponDelete', (data) => {
    weapon.splice(data, 1);
  });

  socket.on('time', (data) => {
    timer = data.minutes + ":" + data.seconds;
  });

  socket.on('game', (data) => {
    document.title = data.title;
    _hub = data.hub;
  });

  socket.on('messages', (data) => {
    messageboard = _.takeRight(data, 5);
  });

  usrInput = createInput();

}


function draw() {
  background(0);

  if (_debugger) {
    console.log('SHIP: { x: ' + ship.pos.x + ' y: ' + ship.pos.y + " }");
  }

  push();
  usrInput.position(width * 0.35, height / 2.3);
  usrInput.class('hub');
  pop();
  var delta = 1 / frameRate();
  // TIMER
  if (_hub) {
    $('.hub').show();
    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text('Preparing game\n' + timer, width / 2, 40);

    // Hello
    if (username != " " || username != "") {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text('Hello ' + username, 30, 30);
      pop();
    }

    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 2);
    text('USERNAME', width / 2, height / 2.5);
    pop();

    push();
    fill(255);
    textAlign(CENTER);
    textSize(75);
    text("Cosmic.IO",width*0.5,height*0.265);
    pop();
  } else if (_canPlay) {
    $('.hub').hide();

    push();

    // TIMER
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text(timer, width / 2, 40);

    // SCORE
    textAlign(LEFT);
    textSize(TEXT_SIZE);
    text('SCORE: ' + scr, 10, height - 10);

    // LEADERBOARD
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      textAlign(RIGHT);
      textSize(TEXT_SIZE);
      let index = 1 + i;
      text(index + ') ' + leaderboard[i].username + ' ' + leaderboard[i].score, width - 10, index * 20);
    }

    // MESSAGEBOARD
    for (let i = 0; i < messageboard.length; i++) {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(messageboard[i].message, 10, height / 2 + -i * 20);
    }

    pop();

    translate(width / 2, height / 2);
    let newscale = 50 / ship.size;
    zoom = lerp(zoom, newscale, 0.1);
    scale(zoom);
    translate(-ship.pos.x, -ship.pos.y);

    for (let i = weapon.length - 1; i >= 0; i--) {

      weapon[i].render();
      weapon[i].update();
      for (let j = ships.length - 1; j >= 0; j--) {
        if (socket.id === ships[j].id) {
          if (weapon[i].hit(ships[j], i)) {
            // HIT
          }
        }
      }
    }

    for (let i = ships.length - 1; i >= 0; i--) {
      if (socket.id !== ships[i].id) {
        push();
        translate(ships[i].x, ships[i].y);
        rotate(ships[i].heading);
        fill(0);
        stroke(255, 0, 0);

        beginShape();
        vertex(-2 / 3 * ships[i].size, -ships[i].size);

        vertex(4 / 3 * ships[i].size, 0);

        vertex(-2 / 3 * ships[i].size, ships[i].size);

        vertex(0 / 3 * ships[i].size, 0);
        vertex(-2 / 3 * ships[i].size, -ships[i].size);
        endShape();
        pop();
        fill(255);
        textAlign(CENTER);
        textSize(TEXT_SIZE);
        text(ships[i].username + '\n <3: ' + ships[i].health, ships[i].x, ships[i].y + ships[i].size * 2);
      } else {
        if (ships[i].health <= 0) {
          _canPlay = false;
        }
        fill(255);
        textAlign(CENTER);
        textSize(TEXT_SIZE);
        text(ships[i].username + '\n <3: ' + ships[i].health, ship.pos.x, ship.pos.y + ship.size * 2);

      }

    }

    for (let i = dust.length - 1; i >= 0; i--) {
      dust[i].render();
      if (ship.collectDust(dust[i])) {
        socket.emit('updatedust', i);
      }
    }

    ship.render();
    ship.update();
    ship.shipRotate();
    ship.edges();
    ship.state();

    for (let i = ships.length - 1; i >= 0; i--) {
      if (ships[i].id === socket.id) {
        let shipData = {
          x: ship.pos.x,
          y: ship.pos.y,
          heading: ship.heading,
          size: ship.size,
          health: ships[i].health,
          usrname: username,
          score: ships[i].score
        }
        scr = ships[i].score
        socket.emit('update', shipData);
      }
    }
  } else {
    $('.hub').hide();

    push();
    // TIMER
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text('You are spectator\n' + timer, width / 2, 40);

    // LEADERBOARD
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      textAlign(RIGHT);
      textSize(TEXT_SIZE);
      let index = 1 + i;
      text(index + ') ' + leaderboard[i].username + ' ' + leaderboard[i].score, width - 10, index * 20);
    }

    // MESSAGEBOARD
    for (let i = 0; i < messageboard.length; i++) {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(messageboard[i].message, 10, height / 2 + -i * 20);
    }
    pop();

    for (let i = ships.length - 1; i >= 0; i--) {
      translate(width / 2, height / 2);
      let newscale = 50 / ship.size;
      zoom = lerp(zoom, newscale, 0.1);
      scale(zoom);
      translate(-ships[0].x, -ships[0].y);

      if (socket.id !== ships[i].id) {
        push();
        translate(ships[i].x, ships[i].y);
        rotate(ships[i].heading);
        fill(0);
        stroke(255, 255, 0);

        beginShape();
        vertex(-2 / 3 * ships[i].size, -ships[i].size);

        vertex(4 / 3 * ships[i].size, 0);

        vertex(-2 / 3 * ships[i].size, ships[i].size);

        vertex(0 / 3 * ships[i].size, 0);
        vertex(-2 / 3 * ships[i].size, -ships[i].size);
        endShape();
        pop();
        fill(255);
        textAlign(CENTER);
        textSize(TEXT_SIZE);
        text(ships[i].username + '\n <3: ' + ships[i].health, ships[i].x, ships[i].y + ships[i].size * 2);
      }
    }

    //Alert
    if (alert.duration > 0) {
      push();
      fill(255);
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(alert.message, width * 0.5, height * 0.8);
      pop();
      console.log(alert.message);
      alert.duration -= delta;
    }

  }
}

function keyPressed() {
  if (keyCode == RIGHT_ARROW || keyCode == 68) {
    ship.rotation = 0.1;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    ship.rotation = -0.1;
  } else if (keyCode == UP_ARROW || keyCode == 87) {
    ship.engineWorking(true);
  } else if (keyCode == 69) {
    // On Press 'E'
    ship.turnedOn(ship.isTuredOn == false ? true : false);
  } else if (keyCode == 16) {
    // On Press 'Shift'
    ship.boostOn(true);
  } else if (keyCode == 32) {
    // On Press 'Space'
    if (_canPlay && !_hub) {
      let weaponData = {
        x: ship.pos.x,
        y: ship.pos.y,
        heading: ship.heading
      }
      socket.emit('weapon', weaponData);
    }
  } else if (keyCode == 13) {
    // On Press 'Enter'
    if (_hub && usrInput.value().length < 18) {
      username = usrInput.value();
    } else if (usrInput.value().length >= 18) {
      username = "Too long bruh";
    }
  }

}

function keyReleased() {
  if (keyCode == UP_ARROW || keyCode == 87) {
    ship.engineWorking(false);
  } else if (keyCode == RIGHT_ARROW || keyCode == 68) {
    ship.rotation = 0;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    ship.rotation = 0;
  } else if (keyCode == 16) {
    // On Release 'Shift'
    ship.boostOn(false);
  } else if (keyCode == 32) {
    // On Release 'Space'
  }
}