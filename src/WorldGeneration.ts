import { MAX_32_BIT_INTEGER } from "./random.ts";
import { Tile } from "./Tile.ts";
import { Shapes } from "./Shapes.ts";
import { Themes } from "./Themes.ts";
import { SimplexOptions, WorkerPool } from "./WorkerPool.ts";

const ROWS = 3;
const COLS = 4;
const NUM_WORKERS = navigator.hardwareConcurrency || 2;

/** Options available for `WorldGeneration`. */
export type WorldGenerationOptions = {
  theme: keyof typeof Themes;
  shape: keyof typeof Shapes;
  simplex: SimplexOptions;
};

/** Default options for `WorldGeneration`. */
const defaultOptions: WorldGenerationOptions = {
  theme: "pixel",
  shape: "circle",
  simplex: {
    frequency: 0.002,
    octaves: 5,
    persistance: 0.5,
    get seed(): number {
      return Math.floor(Math.random() * MAX_32_BIT_INTEGER);
    },
  },
};

/** Generates a simplex noise world. */
export class WorldGeneration extends HTMLElement {
  declare canvas: HTMLCanvasElement;
  declare context: CanvasRenderingContext2D;
  declare height: number;
  declare width: number;
  declare options: WorldGenerationOptions;
  declare workerPool: WorkerPool;
  declare tiles: Tile[];

  /** Adds a canvas with a procedurally generated world. */
  constructor(options: Partial<WorldGenerationOptions> = {}) {
    super();
    this.style.height = "0";
    this.style.display = "block";

    this.options = { ...defaultOptions, ...options };

    const shadowRoot = this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    const context = this.canvas.getContext("2d");
    if (context === null) {
      throw Error("canvas context identifier not supported");
    }
    this.context = context;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    shadowRoot.append(this.canvas);

    this.tiles = [...Tile.tessellate([ROWS, COLS], [this.width, this.height])];
    this.workerPool = new WorkerPool(NUM_WORKERS, "worldGenerationWorker.js");

    this.render();
  }

  /** Generates image data for the canvas. */
  render() {
    const {
      theme,
      shape: name,
      simplex: { ...simplex },
    } = this.options;

    const shape = {
      name,
      xCenter: Math.floor(this.width / 2),
      yCenter: Math.floor(this.height / 2),
    };

    const promises = this.tiles.map((tile) =>
      this.workerPool.addWork({
        tile,
        theme,
        shape,
        simplex,
      })
    );

    Promise.all(promises)
      .then((responses) => {
        for (const { imageData, tile: { x0, y0 } } of responses) {
          this.context.putImageData(imageData, x0, y0);
        }
      })
      .catch((reason) => {
        console.error(reason);
      });
  }
}

customElements.define("world-generation", WorldGeneration);
