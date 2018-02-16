class CosmicDust {
  constructor(s, w, h) {
    this.pos = createVector(w, h);
    this.size = s;
  }

  render() {
    push();
    noFill();
    stroke(255);
    strokeWeight(2);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    pop();
  }

}
