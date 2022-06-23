import gsap from "gsap";
import {
  EventDispatcher,
  Group,
  Mesh,
  MeshLambertMaterial,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  Vector3
} from "three";
// import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import appStore from "./appStore";
import MathUtils from "./utils/MathUtils";

const ENABLED = "enabled";

export default class Block extends EventDispatcher {
  static get ENABLED() {
    return ENABLED;
  }

  constructor(gridPos, position, size, geometry, rectShadowMaterial, circleShadowMaterial) {
    super();

    this.orgPosition = position;
    this.position = new Vector3(position.x, position.y, position.z);
    this.waveYOffset = 0;
    this.gridPos = gridPos;
    this.enabled = false;
    this.enabledByOver = false;
    this.size = size;
    this.shadowSize = size * 1;
    this.shadowYOffset = this.size * 0.9;

    this.hasShadow = false;
    if (this.gridPos.x === 0 || this.gridPos.y === 0) {
      this.hasShadow = true;
    }

    this.group = new Group();
    this.group.position.set(position.x, position.y, position.z);

    this.blockMaterial = new MeshLambertMaterial({
      color: appStore.blockColor
    });

    this.defaultMesh = new Mesh(geometry, this.blockMaterial);
    this.defaultMesh.userData.blockInstance = this;
    this.defaultMesh.position.set(0, 0, 0);

    appStore.interactionManager.add(this.defaultMesh);
    this.defaultMesh.addEventListener("mouseover", () => {
      if (appStore.mousePressed) {
        this.enabledByOver = true;
        this.setEnabled(true);
      }
      document.body.style.cursor = "pointer";
    });

    this.defaultMesh.addEventListener("mouseout", () => {
      this.enabledByOver = false;
      document.body.style.cursor = "unset";
    });

    this.defaultMesh.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      if (this.enabledByOver) {
        this.enabledByOver = false;
        return;
      }
      this.setEnabled(!this.enabled);
    });
    this.defaultMesh.addEventListener("mouseup", () => {
      this.enabledByOver = false;
    });

    this.group.add(this.defaultMesh);

    if (this.hasShadow) {
      const rectShadowGeometry = new PlaneBufferGeometry(this.shadowSize, this.shadowSize);
      this.rectShadowMesh = new Mesh(rectShadowGeometry, rectShadowMaterial);
      this.rectShadowMesh.rotation.x = -(Math.PI / 2);
      this.group.add(this.rectShadowMesh);

      const circleShadowGeometry = new PlaneBufferGeometry(this.shadowSize, this.shadowSize);
      this.circleShadowMesh = new Mesh(circleShadowGeometry, circleShadowMaterial);
      this.circleShadowMesh.rotation.x = -(Math.PI / 2);
    }

    this.selectedMaterial = new MeshLambertMaterial({
      color: appStore.selectedBlockColor
    });

    const selectedGeometry = new SphereBufferGeometry(size / 2, 32, 16);
    this.selectedMesh = new Mesh(selectedGeometry, this.selectedMaterial);
    this.selectedMesh.position.set(0, 0, 0);
  }

  set waveAmp(value) {
    this.waveNorm = MathUtils.norm(value, 60, -70);
    const waveLerp = MathUtils.lerp(this.waveNorm, -3, 3);
    this.waveYOffset = MathUtils.clamp(waveLerp, -3, 1.5);
    // this.waveYOffset = MathUtils.map(value, -70, 60, -3, 3, true);
  }

  setActive(value) {
    if (value) {
      this.blockMaterial.color.setHex(appStore.activeBlockColor);
      gsap.to(this.position, { y: 13.8, duration: 0.05 });
    } else {
      this.blockMaterial.color.setHex(appStore.blockColor);
      gsap.to(this.position, { y: this.orgPosition.y, duration: 0.5 });
    }
  }

  setEnabled(value) {
    this.enabled = value;
    if (value) {
      this.group.add(this.selectedMesh);
      this.group.remove(this.defaultMesh);
      if (this.hasShadow) {
        this.group.add(this.circleShadowMesh);
        this.group.remove(this.rectShadowMesh);
      }
    } else {
      this.group.add(this.defaultMesh);
      this.group.remove(this.selectedMesh);
      if (this.hasShadow) {
        this.group.add(this.rectShadowMesh);
        this.group.remove(this.circleShadowMesh);
      }
    }
    this.dispatchEvent({ type: ENABLED });
  }

  render() {
    this.counter += 0.05;
    this.group.position.y = this.position.y;
    this.defaultMesh.position.y = this.waveYOffset;
    this.selectedMesh.position.y = this.waveYOffset;

    if (this.hasShadow) {
      this.rectShadowMesh.position.y = -this.shadowYOffset + (this.orgPosition.y - this.position.y);
      this.circleShadowMesh.position.y = -this.shadowYOffset + (this.orgPosition.y - this.position.y);

      const scaleOffset = 0.8;
      const shadowScale = MathUtils.lerp(
        this.waveNorm,
        this.shadowSize - scaleOffset,
        this.shadowSize + scaleOffset,
        true
      );
      this.rectShadowMesh.scale.x = shadowScale;
      this.rectShadowMesh.scale.y = shadowScale;
      this.circleShadowMesh.scale.x = shadowScale;
      this.circleShadowMesh.scale.y = shadowScale;
      // this.shadowMesh.material.opacity = MathUtils.lerp(this.waveNorm, 0.4, 0, true);
    }
  }
}
