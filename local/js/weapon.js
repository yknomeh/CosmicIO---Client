class Weapon {
  constructor(id, s, angle, vel) {
    this.id = id;
    this.pos = createVector(s.x, s.y);
    this.velocity = p5.Vector.fromAngle(angle);
    this.velocity.mult(vel);

    this.damage = 1;
  }

  render() {
    push();
    stroke(255,0,0);
    strokeWeight(10);
    point(this.pos.x, this.pos.y);
    pop();
  }

  update() {
    this.pos.add(this.velocity);
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  hit(ship, constructorShip) {
    this.sleep(200).then(()  => {
      let d = dist(this.pos.x, this.pos.y, ship.x, ship.y);
      if (d < ship.size) {
        if (this.id !== socket.id) {
          // console.log("user " + socket.id + ' hit by' + this.id)
          socket.emit('health', -this.damage);
        }
        return true;
      } else {
        return false;
      }
    });

  }


}
