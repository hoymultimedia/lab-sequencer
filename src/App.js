import {
  BoxGeometry,
  Clock,
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer
} from "three";
import { InteractionManager } from "three.interactive";
import GUI from "lil-gui";
import Grid from "./Grid";
import Sequencer from "./Sequencer";
import appStore from "./appStore";
import Block from "./Block";
import RadioButtons from "./RadioButtons";
import GridPos from "./GridPos";
import Button from "./Button";

import crossCircleImg from "./assets/images/cross-circle.png";
import copyLinkImg from "./assets/images/copy-link.png";
import gsap from "gsap";

//TODO: Performance fix check if we should use InstancedMesh for blocks

export default class App {
  constructor(element) {
    this.element = element;
    this.width = element.clientWidth;
    this.height = element.clientHeight;

    this.setupApp();
    this.setupLight();
    this.setupMouseHandler();

    window.addEventListener("resize", () => {
      this.onResize();
    });

    this.start();

    this.update();
    this.onResize();
  }

  setupApp() {
    this.clock = new Clock();
    this.scene = new Scene();
    this.scene.background = new Color(appStore.backgroundColor);

    const aspect = window.innerWidth / window.innerHeight;
    this.frustum = 20;
    this.camera = new OrthographicCamera(
      -this.frustum * aspect,
      this.frustum * aspect,
      this.frustum,
      -this.frustum,
      1,
      1000
    );
    this.camera.position.set(100, 100, 100);
    this.camera.lookAt(this.scene.position);

    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.width, this.height);
    this.element.appendChild(this.renderer.domElement);

    const geom = new BoxGeometry(35.5, 1, 35.5);
    const material = new MeshLambertMaterial({ color: appStore.backgroundColor, side: DoubleSide });
    const plane = new Mesh(geom, material);
    plane.receiveShadow = true;
    plane.position.x = 15;
    plane.position.y = 11.9;
    plane.position.z = 15;
    this.scene.add(plane);
  }

  setupDevGUI() {
    const gui = new GUI();
    gui.add(document, "title");
    gui.close();

    const scene = gui.addFolder("Scene");
    scene.addColor(this.scene, "background");

    const hemisphereLight = gui.addFolder("Hemisphere Light");
    hemisphereLight.add(this.hemisphereLight.position, "x");
    hemisphereLight.add(this.hemisphereLight.position, "y");
    hemisphereLight.add(this.hemisphereLight.position, "z");
    hemisphereLight.addColor(this.hemisphereLight, "color");
    hemisphereLight.addColor(this.hemisphereLight, "groundColor");

    const blockMaterial = gui.addFolder("Block");
    blockMaterial.addColor(appStore, "blockColor");
    blockMaterial.addColor(appStore, "activeBlockColor");
    blockMaterial.addColor(appStore, "selectedBlockColor").onChange((e) => {
      for (let i = 0; i < this.grid.blocks.length; i++) {
        const block = this.grid.blocks[i];
        block.selectedMaterial.color.setHex(e);
      }
    });

    const selectorGUI = gui.addFolder("Selector GUI");
    selectorGUI.addColor(appStore, "synthSelectColor").onChange((e) => {
      for (let i = 0; i < this.synthSelector.buttons.length; i++) {
        const btn = this.synthSelector.buttons[i];
        btn.material.color.setHex(e);
      }
    });
    selectorGUI.addColor(appStore, "oscillatorSelectColor").onChange((e) => {
      for (let i = 0; i < this.oscillatorSelector.buttons.length; i++) {
        const btn = this.oscillatorSelector.buttons[i];
        btn.material.color.setHex(e);
      }
    });
    selectorGUI.addColor(appStore, "effectSelectColor").onChange((e) => {
      for (let i = 0; i < this.effectSelector.buttons.length; i++) {
        const btn = this.effectSelector.buttons[i];
        btn.material.color.setHex(e);
      }
    });

    const directionalLight = gui.addFolder("Directional Light");
    directionalLight.add(this.directionalLight.position, "x");
    directionalLight.add(this.directionalLight.position, "y");
    directionalLight.add(this.directionalLight.position, "z");
    directionalLight.addColor(this.directionalLight, "color");
  }

  setupLight() {
    this.hemisphereLight = new HemisphereLight(0xffffe0, 0x000000, 1);
    this.hemisphereLight.position.set(2, 3, 4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new DirectionalLight(0xffffff, 0.3);
    this.directionalLight.position.set(0, 20, 0);

    this.scene.add(this.directionalLight);

    // const helper = new CameraHelper(this.directionalLight.shadow.camera);
    // this.scene.add(helper);
  }

  setupMouseHandler() {
    this.interactionManager = new InteractionManager(this.renderer, this.camera, this.renderer.domElement);
    appStore.interactionManager = this.interactionManager;

    this.pointerRaycaster = new Raycaster();
    this.pointerDown = false;
    this.pointer = new Vector2();

    window.addEventListener("mousedown", () => {
      if (this.hasStarted === false) {
        this.sequencer.start();
        this.hasStarted = true;
      }
      appStore.mousePressed = true;
    });
    window.addEventListener("mouseup", () => {
      appStore.mousePressed = false;
    });
  }

  setupGUI() {
    const yPos = 13.4;
    const zPos = 31.8;

    this.synthSelector = new RadioButtons(this.sequencer.synthIds, appStore.synthSelectColor);
    this.synthSelector.addEventListener(RadioButtons.SELECT, (value) => {
      this.sequencer.selectSynth(value.id);
    });
    this.synthSelector.group.position.set(24.6, yPos, zPos);
    this.synthSelector.selectButton(this.sequencer.synthIds[this.sequencer.currentSynthIndex]);
    this.scene.add(this.synthSelector.group);

    this.oscillatorSelector = new RadioButtons(this.sequencer.oscillatorIds, appStore.oscillatorSelectColor);
    this.oscillatorSelector.addEventListener(RadioButtons.SELECT, (value) => {
      this.sequencer.selectOscillatorType(value.id);
    });
    this.oscillatorSelector.group.position.set(14, yPos, zPos);
    this.oscillatorSelector.selectButton(this.sequencer.oscillatorIds[this.sequencer.currentOscillatorIndex]);
    this.scene.add(this.oscillatorSelector.group);

    this.effectSelector = new RadioButtons(this.sequencer.effectIds, appStore.effectSelectColor);
    this.effectSelector.addEventListener(RadioButtons.SELECT, (value) => {
      this.sequencer.selectEffect(value.id);
    });
    this.effectSelector.group.position.set(2.5, yPos, zPos);
    this.effectSelector.selectButton(this.sequencer.effectIds[this.sequencer.currentEffectIndex]);
    this.scene.add(this.effectSelector.group);

    const clearBtn = new Button(1.5, appStore.clearButtonColor, crossCircleImg);
    clearBtn.group.position.set(31.5, 13.3, 29.0);
    clearBtn.addEventListener(Button.CLICK, () => {
      this.grid.clear();
    });
    this.scene.add(clearBtn.group);

    const copyLinkBtn = new Button(1.5, appStore.clearButtonColor, copyLinkImg);
    copyLinkBtn.group.position.set(31.5, 13.3, 27.0);
    copyLinkBtn.addEventListener(Button.CLICK, () => {
      this.copyShareUrl();
    });
    this.scene.add(copyLinkBtn.group);
  }

  start() {
    this.createGrid();
    this.setupSequencer();
    // this.setupDevGUI();
    this.setupGUI();
    if (window.location.search !== "") {
      this.loadQuery();
    }
    this.hasStarted = false;
  }

  setupSequencer() {
    this.sequencer = new Sequencer(appStore.beatLength, appStore.numNotes);
    this.sequencer.addEventListener(Sequencer.ON_BEAT, (event) => {
      this.grid.updateBeat(event.beat, event.beatItems);
    });
  }

  createGrid() {
    this.grid = new Grid(this.scene, appStore.beatLength, appStore.numNotes);
    for (let i = 0; i < this.grid.blocks.length; i++) {
      const block = this.grid.blocks[i];
      block.addEventListener(Block.ENABLED, (event) => {
        const { gridPos, enabled } = event.target;
        this.sequencer.getBeatItem(gridPos).enabled = enabled;
      });
    }
  }

  copyShareUrl() {
    const urlParams = {
      notes: [],
      synth: this.sequencer.currentSynthId,
      effect: this.sequencer.currentEffectId,
      oscillator: this.sequencer.currentOscillatorId
    };

    for (let i = 0; i < this.grid.blocks.length; i++) {
      const block = this.grid.blocks[i];
      const { gridPos } = block;
      if (this.sequencer.getBeatItem(gridPos).enabled) {
        urlParams.notes.push(block.gridPos.id);
      }
    }

    const baseUrl = location.toString().replace(location.search, "");
    const qs = new URLSearchParams(urlParams);
    const shareUrl = baseUrl + "?" + qs.toString();

    const shareUrlElement = window.document.getElementById("shareUrl");
    shareUrlElement.textContent = "Url copied! " + shareUrl.substring(0, 44) + "...";
    gsap.to(shareUrlElement, { color: "#798c7a", opacity: 1, bottom: 20, duration: 0.3 });
    gsap.to(shareUrlElement, { color: "#798c7a", opacity: 0, bottom: 0, duration: 0.3, delay: 1 });

    navigator.clipboard.writeText(shareUrl);
    return shareUrl;
  }

  loadQuery() {
    const url = new URL(decodeURIComponent(window.location.href));
    const notes = new URLSearchParams(url.search).get("notes").split(",");
    const synth = new URLSearchParams(url.search).get("synth");
    const effect = new URLSearchParams(url.search).get("effect");
    const oscillator = new URLSearchParams(url.search).get("oscillator");
    for (let i = 0; i < notes.length; i++) {
      if (notes[i] !== "") {
        const x_y = notes[i].split("_");
        const gridPos = new GridPos(x_y[0], x_y[1]);
        this.grid.getBlock(gridPos).setEnabled(true);
      }
    }
    console.log("oscillator: ", oscillator);
    this.synthSelector.selectButton(synth, true);
    this.effectSelector.selectButton(effect, true);
    this.oscillatorSelector.selectButton(oscillator, true);
  }

  update() {
    const deltaTime = this.clock.getDelta();
    this.renderer.render(this.scene, this.camera);

    this.grid.render(deltaTime);
    this.interactionManager.update();
    requestAnimationFrame(() => {
      this.update();
    });
  }

  onResize() {
    if (this.renderer) {
      const aspect = window.innerWidth / window.innerHeight;
      this.camera.left = -this.frustum * aspect;
      this.camera.right = this.frustum * aspect;
      this.camera.top = this.frustum;
      this.camera.bottom = -this.frustum;

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.updateProjectionMatrix();
    }
  }
}
