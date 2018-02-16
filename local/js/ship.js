class Ship {
  constructor(s, w, h, renderSize) {
    this.pos = createVector(w, h);
    this.size = s;
    this.v = createVector(0, 0);
    this.heading = 0;
    this.rotation = 0;

    this.isTuredOn = false;
    this.isWorking = false;
    this.boost = 0.95;

    this.renderSize = renderSize;

    this.health = 100;
  }

  render() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.heading);
    fill(0);
    stroke(255);

    beginShape();
    vertex(-2 / 3 * this.size, -this.size);

    vertex(4 / 3 * this.size, 0);

    vertex(-2 / 3 * this.size, this.size);

    vertex(0 / 3 * this.size, 0);
    vertex(-2 / 3 * this.size, -this.size);
    endShape();
    pop();
  }

  state() {
    if (this.health <= 0) {
      this.dead();
    }
  }

  dead() {
    this.health = 100;
    this.pos.x = 0;
    this.pos.y = 0;
    this.heading = 0;
  }

  update() {
    if (this.isTuredOn && this.isWorking) {
      this.engine();
    }
    this.pos.add(this.v);
    this.v.mult(this.boost);
  }

  turnedOn(turnedOn) {
    this.isTuredOn = turnedOn;
  }

  engineWorking(working) {
    this.isWorking = working;
  }

  boostOn(works) {
    if (works) {
      this.boost = 1;
    } else {
      this.boost = 0.95;
    }
  }

  engine() {
      let force = p5.Vector.fromAngle(this.heading);
      this.v.mult(0.95);
      this.v.add(force);
  }

  shipRotate() {
    this.heading += this.rotation;
  }

  collectDust(dust) {
    let d = p5.Vector.dist(this.pos, dust.pos);
    if (d < this.size + dust.size) {
      this.size += dust.size * 0.02;
      return true;
    } else {
      return false;
    }
  }

  moonGravity(moon) {
    let dist = p5.Vector.dist(this.pos, moon.pos);
    let moonPos = createVector(moon.pos.x, moon.pos.y);
    if (dist < this.size + moon.size) {
      moonPos.setMag(-20);
      this.pos.add(moonPos);
      return true;
    } else if (dist < this.size + moon.size * moon.gravity) {
      // Here's gonna be gravitation of moon...
    } else {
      return false;
    }
  }

  edges() {
    if (this.pos.x > width * this.renderSize) {
      this.pos.x = 0;
      this.boostOn(false);
      ship.engineWorking(false);
      alert('Go back to shadow!');
    } else if (this.pos.x < -width * this.renderSize) {
      this.pos.x = 0;
      this.boostOn(false);
      ship.engineWorking(false);
      alert('Go back to shadow!');
    }
    if (this.pos.y > height * this.renderSize) {
      this.pos.y = 0;
      this.boostOn(false);
      ship.engineWorking(false);
      alert('Go back to shadow!');
    } else if (this.pos.y < -height * this.renderSize) {
      this.pos.y = 0;
      this.boostOn(false);
      ship.engineWorking(false);
      alert('Go back to shadow!');
    }
  }

}
