const G2 = (3 - Math.sqrt(3)) / 6;
const Grad = [
    [
        1,
        1
    ],
    [
        -1,
        1
    ],
    [
        1,
        -1
    ],
    [
        -1,
        -1
    ],
    [
        1,
        0
    ],
    [
        -1,
        0
    ],
    [
        1,
        0
    ],
    [
        -1,
        0
    ],
    [
        0,
        1
    ],
    [
        0,
        -1
    ],
    [
        0,
        1
    ],
    [
        0,
        -1
    ], 
];
function makeNoise2D(random = Math.random) {
    const p = new Uint8Array(256);
    for(let i = 0; i < 256; i++)p[i] = i;
    let n;
    let q;
    for(let i1 = 255; i1 > 0; i1--){
        n = Math.floor((i1 + 1) * random());
        q = p[i1];
        p[i1] = p[n];
        p[n] = q;
    }
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for(let i2 = 0; i2 < 512; i2++){
        perm[i2] = p[i2 & 255];
        permMod12[i2] = perm[i2] % 12;
    }
    return (x, y)=>{
        const s = (x + y) * 0.5 * (Math.sqrt(3) - 1);
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const g0 = Grad[permMod12[ii + perm[jj]]];
        const g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]];
        const g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]];
        const t0 = 0.5 - x0 * x0 - y0 * y0;
        const n0 = t0 < 0 ? 0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0);
        const t1 = 0.5 - x1 * x1 - y1 * y1;
        const n1 = t1 < 0 ? 0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1);
        const t2 = 0.5 - x2 * x2 - y2 * y2;
        const n2 = t2 < 0 ? 0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2);
        return 70.14805770653952 * (n0 + n1 + n2);
    };
}
const PERSISTANCE = 0.5;
const totalAmplitude = 2 - 1 / 2 ** (10 - 1);
const centerY = Math.floor(window.innerHeight / 2);
const centerX = Math.floor(window.innerWidth / 2);
const distanceToWall = Math.min(centerX, centerY);
const simplexNoise = makeNoise2D();
function circle(x, y) {
    const distanceX = x - centerX;
    const distanceY = y - centerY;
    const distance = Math.hypot(distanceX, distanceY);
    return Math.min(1, distance / distanceToWall);
}
function noise(x, y) {
    let result = 0, amplitude = 1, frequency = 0.002;
    for(let octave = 0; octave < 10; octave++){
        result += amplitude * simplexNoise(x * frequency, y * frequency);
        amplitude *= PERSISTANCE;
        frequency *= 2;
    }
    return (1 + result / totalAmplitude) / 2;
}
function ensemble(x, y) {
    return (noise(x, y) - circle(x, y) + 1) / 2;
}
class WorldGeneration1 extends HTMLElement {
    canvas;
    context;
    height;
    width;
    imageData;
    constructor(){
        super();
        const shadowRoot = this.attachShadow({
            mode: "open"
        });
        this.canvas = document.createElement("canvas");
        const context1 = this.canvas.getContext("2d");
        if (context1 === null) {
            throw Error("canvas context identifier not supported");
        }
        this.context = context1;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        shadowRoot.append(this.canvas);
        this.generate();
    }
    generate() {
        const imageData = new ImageData(this.width, this.height);
        const buffer = new Uint32Array(imageData.data.buffer);
        for(let x = 0; x < this.width; x++){
            for(let y = 0; y < this.height; y++){
                buffer[this.width * y + x] = 256 * ensemble(x, y) << 24;
            }
        }
        console.log(imageData);
        this.context.putImageData(imageData, 0, 0);
    }
}
customElements.define("world-generation", WorldGeneration1);
export { WorldGeneration1 as WorldGeneration };
