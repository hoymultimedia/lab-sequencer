import { EventDispatcher } from "three";
import {
  AMSynth,
  Chorus,
  Destination,
  Distortion,
  DuoSynth,
  Filter,
  FMSynth,
  MembraneSynth,
  MonoSynth,
  PingPongDelay,
  Reverb,
  Synth,
  Transport
} from "tone";
import BeatItem from "./BeatItem";
import GridPos from "./GridPos";
import MathUtils from "./utils/MathUtils";

const ON_BEAT = "onBeat";
// https://codepen.io/COLTONTEEFY/pen/JqRmML
// https://gist.github.com/Pandan/c7c97f5644018b93f11c9b9939866019
// https://github.com/MaxLaumeister/ToneMatrixRedux
export default class Sequencer extends EventDispatcher {
  static get ON_BEAT() {
    return ON_BEAT;
  }

  constructor(beatLength, numberOfNotes) {
    super();
    this.grid = new Array(beatLength).fill(null).map(() => new Array(numberOfNotes).fill(null));
    this.beat = 0;
    this.beatLength = beatLength;
    this.numberOfNotes = numberOfNotes;

    // const mainNotes = ["B", "A", "F#", "E", "D"];
    const mainNotes = ["B#", "D", "F", "G", "A"];
    const notes = [];
    let mainNoteIndex = 0;
    let octaveIndex = 4;
    for (let i = 0; i < this.numberOfNotes; i++) {
      if (mainNoteIndex === mainNotes.length) {
        mainNoteIndex = 0;
        octaveIndex -= 1;
      }
      const note = String(mainNotes[mainNoteIndex] + octaveIndex);
      notes.push(note);
      mainNoteIndex += 1;
    }

    for (let x = 0; x < this.beatLength; x++) {
      for (let y = 0; y < this.numberOfNotes; y++) {
        const note = notes[y];
        this.grid[x][y] = new BeatItem(note, new GridPos(x, y));
      }
    }

    this.currentSynthIndex = 0;
    // "DuoSynth"
    this.synthIds = ["Synth", "MonoSynth", "AMSynth", "FMSynth", "MembraneSynth"];
    this.currentOscillatorIndex = 0;
    this.oscillatorIds = ["sine", "triangle", "square", "sawtooth"];
    this.currentEffectIndex = 0;
    this.effectIds = ["none", "reverb", "chorus", "distortion", "pingPong"];

    this.selectEffect(this.effectIds[this.currentEffectIndex]);
    this.selectSynth(this.synthIds[this.currentSynthIndex]);
    this.selectOscillatorType(this.oscillatorIds[this.currentOscillatorIndex]);
  }

  selectEffect(effectId) {
    this.currentEffectId = effectId;
    if (this.synths && this.effect) {
      for (let i = 0; i < this.numberOfNotes; i++) {
        this.synths[i].disconnect(this.effect);
      }
      this.effect.disconnect();
    }
    switch (effectId) {
      case "none":
        this.effect = null;
        break;
      case "reverb":
        this.effect = new Reverb(3).toDestination();
        break;
      case "chorus":
        this.effect = new Chorus(4, 2.5, 0.5).connect(Destination);
        break;
      case "distortion":
        this.effect = new Distortion(0.8).connect(Destination);
        break;
      case "pingPong":
        this.effect = new PingPongDelay("8n", 0.2).connect(Destination);
        break;
    }
    if (this.synths && this.effect) {
      for (let i = 0; i < this.numberOfNotes; i++) {
        this.synths[i].connect(this.effect);
      }
    }
  }

  selectSynth(synthId) {
    this.currentSynthId = synthId;
    const options = {
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    };
    const filterOptions = {
      frequency: 1100,
      rolloff: -12
    };
    const filter = new Filter(filterOptions).toDestination();

    if (this.synths) {
      for (let i = 0; i < this.synths.length; i++) {
        const synth = this.synths[i];
        synth.dispose();
      }
    }

    this.synths = [];
    switch (synthId) {
      case "Synth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new Synth(options).toDestination();
          this.synths.push(synth);
        }
        break;
      case "MonoSynth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new MonoSynth().toDestination();
          this.synths.push(synth);
        }
        break;
      case "DuoSynth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new DuoSynth().toDestination();
          this.synths.push(synth);
        }
        break;
      case "AMSynth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new AMSynth().toDestination();
          this.synths.push(synth);
        }
        break;
      case "FMSynth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new FMSynth().toDestination();
          this.synths.push(synth);
        }
        break;
      case "MembraneSynth":
        for (let i = 0; i < this.numberOfNotes; i++) {
          const synth = new MembraneSynth().toDestination();
          this.synths.push(synth);
        }
        break;

      default:
    }
    for (let i = 0; i < this.numberOfNotes; i++) {
      const synth = this.synths[i];
      if (this.effect) {
        synth.connect(this.effect);
      }
      if (this.currentOscillatorId) {
        synth.oscillator.type = this.currentOscillatorId;
      }
      synth.connect(filter);
    }
    // synth.oscillator.type = oscillatorType;
  }

  selectOscillatorType(id) {
    this.currentOscillatorId = id;
    for (let i = 0; i < this.synths.length; i++) {
      this.synths[i].oscillator.type = id;
    }
  }

  start() {
    Transport.bpm.value = 120;

    Transport.scheduleRepeat((time) => {
      this.update(time);
    }, "8n");

    if (Transport.context.state !== "running") {
      Transport.context.resume();
    }
    Transport.start();
  }

  playNote(note, time, noteIndex, volume) {
    const synth = this.synths[noteIndex];
    synth.volume.setValueAtTime(volume, time);
    synth.triggerAttackRelease(note, "8n", time);
  }

  getBeatItem(pos) {
    const beatItem = this.grid[pos.x][pos.y];
    return beatItem;
  }

  update(time) {
    this.time = time;
    this.beat = (this.beat + 1) % this.beatLength;
    const beatItems = [];

    const highVolume = -12;
    const lowVolume = -20;
    let enableNotes = 0;
    for (let y = 0; y < this.numberOfNotes; y++) {
      const beatItem = this.grid[this.beat][y];
      if (beatItem.enabled) {
        enableNotes += 1;
      }
    }

    for (let y = 0; y < this.numberOfNotes; y++) {
      const beatItem = this.grid[this.beat][y];
      if (beatItem.enabled) {
        // const toneBeatOffset = y / 100; // Each tone needs to have a unique
        const volume = MathUtils.map(enableNotes, 1, this.numberOfNotes, highVolume, lowVolume);
        this.playNote(beatItem.note, this.time, y, volume);
      }
      beatItems.push(this.grid[this.beat][y]);
    }
    this.dispatchEvent({ type: ON_BEAT, beat: this.beat, beatItems: beatItems });
  }
}
