export default class GridPos {
  constructor(x = 0, y = 0) {
    this.init(x, y);
  }

  init(x, y) {
    this.x = x;
    this.y = y;
  }

  get id() {
    return `${this.x}_${this.y}`;
  }
}
