import { BoxBufferGeometry, BoxGeometry, MeshBasicMaterial, TextureLoader, Vector3 } from "three";
// import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Block from "./Block";
import GridPos from "./GridPos";
import WaveAnimation from "./WaveAnimation";

import rectShadowImg from "./assets/images/rect-shadow.png";
import circleShadowImg from "./assets/images/circle-shadow.png";

export default class Grid {
  constructor(scene, cols, rows) {
    this.scene = scene;
    this.cols = cols;
    this.rows = rows;
    const size = 1.5;
    const gap = 0.3;

    const boxGeom = new BoxBufferGeometry(size, size, size);

    this.grid = new Array(this.cols).fill(null).map(() => new Array(this.rows).fill(null));
    this.blocks = [];
    this.meshes = [];

    const rectShadowTexture = new TextureLoader().load(rectShadowImg);
    const rectShadowMaterial = new MeshBasicMaterial({ map: rectShadowTexture, transparent: true, depthWrite: false });
    rectShadowMaterial.opacity = 0.5;

    const circleShadowTexture = new TextureLoader().load(circleShadowImg);
    const circleShadowMaterial = new MeshBasicMaterial({
      map: circleShadowTexture,
      transparent: true,
      depthWrite: false
    });
    circleShadowMaterial.opacity = 0.5;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const gridPos = new GridPos(x, y);
        const vX = (this.rows - y) * (size + gap);
        const vY = 14;
        const vZ = (this.cols - x) * (size + gap);
        const pos = new Vector3(vX, vY, vZ);
        const block = new Block(gridPos, pos, size, boxGeom, rectShadowMaterial, circleShadowMaterial);
        this.scene.add(block.group);
        this.grid[x][y] = block;
        this.blocks.push(block);
        this.meshes.push(block.defaultMesh);
      }
      this.wave = new WaveAnimation(this.grid);
    }

    this.wave.update();
  }

  getBlock(gridPos) {
    return this.grid[gridPos.x][gridPos.y];
  }

  updateBeat(beat, beatItems) {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const item = this.grid[x][y];
        // eslint-disable-next-line no-unused-vars
        const beatItem = beatItems[y];
        const { enabled, gridPos } = beatItem;
        if (enabled) {
          this.wave.current[gridPos.x][gridPos.y] = 100;
        }

        if (beat === x) {
          item.setActive(true);
        } else {
          item.setActive(false);
        }
      }
    }
  }

  clear() {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      block.setEnabled(false);
    }
  }

  render(deltaTime) {
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].render(deltaTime);
    }
  }
}
