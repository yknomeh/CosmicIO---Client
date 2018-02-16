class Moons {
  constructor(s, w, h) {
    this.pos = createVector(w, h);
    this.size = s;
    this.gravity = 2;
  }

  render() {
    fill(255);
    stroke(255);
    ellipseMode(CENTER);
    ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
  }
}
