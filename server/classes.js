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
  