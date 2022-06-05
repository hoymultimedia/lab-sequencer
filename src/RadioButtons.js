import gsap from "gsap";
import {
  BoxBufferGeometry,
  EventDispatcher,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneBufferGeometry,
  TextureLoader
} from "three";
import appStore from "./appStore";
import rectShadowImg from "./assets/images/rect-shadow.png";

const SELECT = "select";

export default class RadioButtons extends EventDispatcher {
  static get SELECT() {
    return SELECT;
  }
  constructor(list, color) {
    super();
    this.animating = false;
    this.color = color;
    this.list = list;
    this.selectedId = null;
    this.buttons = [];
    this.group = new Group();
    this.setupButtons();
  }

  setupButtons() {
    const rectShadowTexture = new TextureLoader().load(rectShadowImg);
    const rectShadowMaterial = new MeshBasicMaterial({ map: rectShadowTexture, transparent: true, depthWrite: false });
    rectShadowMaterial.opacity = 0.5;

    for (let i = 0; i < this.list.length; i++) {
      const btnGroup = new Group();
      this.size = 1;
      const gap = 0.2;
      btnGroup.position.set((this.size + gap) * i, 0, 0);

      const btn = this.createButton(this.size);
      btn.userData = { id: this.list[i] };
      btn.addEventListener("click", (event) => {
        this.selectButton(event.target.userData.id);
      });
      btnGroup.add(btn);
      this.buttons.push(btn);

      const shadowSize = this.size * 1.5;
      const shadowYOffset = this.size * 0.2;
      const rectShadowGeometry = new PlaneBufferGeometry(shadowSize, shadowSize);
      const rectShadowMesh = new Mesh(rectShadowGeometry, rectShadowMaterial);
      rectShadowMesh.rotation.x = -(Math.PI / 2);
      rectShadowMesh.position.y = -shadowYOffset;
      btnGroup.add(rectShadowMesh);

      this.group.add(btnGroup);
    }
  }

  selectButton(id) {
    if (this.animating) return;

    this.animating = true;
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      gsap.to(btn.scale, { y: this.size, duration: 0.1, ease: "power1.out" });
      btn.material.color.setHex(this.color);
      if (btn.userData.id === id) {
        gsap.to(btn.scale, {
          y: 0.5,
          duration: 0.2,
          ease: "power1.out",
          onComplete: () => {
            this.animating = false;
          }
        });
        btn.material.color.setHex(appStore.activeSelectColor);
      }
    }
    this.selectedId = id;
    this.dispatchEvent({ type: SELECT, id: id });
  }

  createButton(size) {
    // const geom = new RoundedBoxGeometry(size, size, size, 1, 0.2);
    const geom = new BoxBufferGeometry(size, size, size);
    const blockMaterial = new MeshLambertMaterial({
      color: this.color
    });
    const btnMesh = new Mesh(geom, blockMaterial);
    btnMesh.geometry.translate(0, this.size / 2, 0);
    appStore.interactionManager.add(btnMesh);

    return btnMesh;
  }
}
