export default class WaveAnimation {
  constructor(grid) {
    this.grid = grid;
    this.dampening = 0.75;
    this.smallest = 0;
    this.cols = this.grid[0].length;
    this.rows = this.grid.length;

    this.current = new Array(this.cols).fill(0).map(() => new Array(this.rows).fill(0));
    this.previous = new Array(this.cols).fill(0).map(() => new Array(this.rows).fill(0));

    this.fps = 60;
  }

  getItem(array, i, j) {
    if (array[i] && array[i][j]) {
      return array[i][j];
    }
    return 1;
  }

  update() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.current[i][j] =
          (this.getItem(this.previous, i - 1, j) + // this.previous[i - 1][j] +
            this.getItem(this.previous, i + 1, j) + // this.previous[i + 1][j] +
            this.getItem(this.previous, i, j - 1) + // this.previous[i][j - 1] +
            this.getItem(this.previous, i, j + 1)) / // this.previous[i][j + 1]) /
            4 -
          this.current[i][j] * 1;

        // eslint-disable-next-line operator-assignment
        this.current[i][j] = this.current[i][j] * this.dampening;

        /*
        if (this.current[i][j] > this.smallest) {
          this.smallest = this.current[i][j];
        }
        */

        this.grid[i][j].waveAmp = this.current[i][j];
      }
    }
    // console.log("u", this.smallest);
    // console.log('c', MathUtils.round(this.current[0][0], 3), this.smallest);

    const temp = this.previous;
    this.previous = this.current;
    this.current = temp;

    setTimeout(() => {
      requestAnimationFrame(() => {
        this.update();
      });
    }, 1000 / this.fps);
  }
}
