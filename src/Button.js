import {
  BoxBufferGeometry,
  EventDispatcher,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneBufferGeometry,
  TextureLoader
} from "three";

import rectShadowImg from "./assets/images/rect-shadow.png";

import appStore from "./appStore";
import gsap from "gsap";

const CLICK = "click";

export default class Button extends EventDispatcher {
  static get CLICK() {
    return CLICK;
  }
  constructor(size, color, iconUrl) {
    super();
    this.group = new Group();

    const rectShadowTexture = new TextureLoader().load(rectShadowImg);
    const rectShadowMaterial = new MeshBasicMaterial({ map: rectShadowTexture, transparent: true, depthWrite: false });
    rectShadowMaterial.opacity = 0.5;

    const geom = new BoxBufferGeometry(size, size * 0.25, size);
    const blockMaterial = new MeshLambertMaterial({
      color: color
    });
    const btnMesh = new Mesh(geom, blockMaterial);

    const rectShadowGeometry = new PlaneBufferGeometry(size * 1.5, size * 1.5);
    const rectShadowMesh = new Mesh(rectShadowGeometry, rectShadowMaterial);

    rectShadowMesh.rotation.x = -(Math.PI / 2);
    rectShadowMesh.position.y = -size * 0.3;

    const iconTexture = new TextureLoader().load(iconUrl);
    const iconMaterial = new MeshBasicMaterial({ map: iconTexture, transparent: true, depthWrite: true });
    iconMaterial.map.minFilter = LinearFilter;

    const iconSize = size * 0.7;
    const iconOrgYPos = size * 0.13;
    const iconGeom = new PlaneBufferGeometry(iconSize, iconSize);
    const iconMesh = new Mesh(iconGeom, iconMaterial);
    iconMesh.position.y = iconOrgYPos;
    iconMesh.rotation.x = -(Math.PI / 2);

    this.group.add(rectShadowMesh);
    this.group.add(btnMesh);
    this.group.add(iconMesh);

    appStore.interactionManager.add(btnMesh);
    btnMesh.addEventListener("click", () => {
      const duration = 0.1;
      gsap.to(btnMesh.position, { y: -0.2, duration, ease: "power1.out" });
      gsap.to(iconMesh.position, { y: iconOrgYPos - 0.2, duration, ease: "power1.out" });
      const delay = duration;
      gsap.to(btnMesh.position, { y: 0, duration: 0.1, ease: "power1.out", delay });
      gsap.to(iconMesh.position, { y: iconOrgYPos, duration: 0.1, ease: "power1.out", delay });
      this.dispatchEvent({ type: CLICK });
    });
  }
}
