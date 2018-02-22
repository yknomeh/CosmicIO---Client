class Weapon {
  constructor(id, s, angle, vel, shoter) {
    this.id = id;
    this.pos = createVector(s.x, s.y);
    this.velocity = p5.Vector.fromAngle(angle);
    this.velocity.mult(vel);

    this.damage = 5;
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

  hit(ship, id) {
    this.sleep(150).then(()  => {
      let d = dist(this.pos.x, this.pos.y, ship.x, ship.y);
      if (d < ship.size) {
        if (this.id !== socket.id) {
          let data = {
            damage: -this.damage,
            splice: id,
            shoter: this.id
          };
          socket.emit('health', data);
          return true;
        } 
      } else {
        return false;
      }
    });

  }


}
