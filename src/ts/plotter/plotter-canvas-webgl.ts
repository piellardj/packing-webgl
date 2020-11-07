import { IPoint } from "../utils/i-point";
import { Color } from "../utils/color";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import { PatternBase } from "../patterns/pattern-base";
import { PatternCircle } from "../patterns/pattern-circle";
import { PatternSquare } from "../patterns/pattern-square";

import { initGL, gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";

import "../page-interface-generated";

class PlotterCanvasWebGL extends PlotterCanvasBase {
    private linesColor: Color;

    private linesShader: Shader | null;
    private squaresShader: Shader | null;
    private circlesShader: Shader | null;

    private readonly linesBuffer: number[];
    private readonly linesVBO: VBO;

    private positionsBuffer: Float32Array;
    private readonly positionsVBO: VBO;

    private sizesBuffer: Float32Array;
    private readonly sizesVBO: VBO;

    private colorsBuffer: Float32Array;
    private readonly colorsVBO: VBO;

    public constructor() {
        super();

        if (!initGL()) {
            throw new Error("Failed to initialize WebGL.");
        }
        console.log(`Max point size supported by WebGL: "${gl.ALIASED_POINT_SIZE_RANGE}" pixels.`);

        this.linesColor = new Color(0, 255, 0);

        this.linesShader = null;
        this.squaresShader = null;
        this.circlesShader = null;

        this.linesBuffer = [];
        this.linesVBO = new VBO(gl, new Float32Array(this.linesBuffer), 2, gl.FLOAT, false);

        this.positionsBuffer = new Float32Array([]);
        this.positionsVBO = new VBO(gl, this.positionsBuffer, 2, gl.FLOAT, false);

        this.sizesBuffer = new Float32Array([]);
        this.sizesVBO = new VBO(gl, this.sizesBuffer, 1, gl.FLOAT, false);

        this.colorsBuffer = new Float32Array([]);
        this.colorsVBO = new VBO(gl, this.colorsBuffer, 4, gl.FLOAT, false);

        ShaderManager.buildShader({
            vertexFilename: "lines.vert",
            fragmentFilename: "lines.frag",
            injected: {},
        }, (builtShader: Shader | null) => {
            if (builtShader === null) {
                throw new Error("Failed to load or build the lines shader.");
            }
            this.linesShader = builtShader;
        });

        ShaderManager.buildShader({
            vertexFilename: "items.vert",
            fragmentFilename: "squares.frag",
            injected: {},
        }, (builtShader: Shader | null) => {
            if (builtShader === null) {
                throw new Error("Failed to load or build the squares shader.");
            }
            this.squaresShader = builtShader;
        });

        ShaderManager.buildShader({
            vertexFilename: "items.vert",
            fragmentFilename: "circles.frag",
            injected: {},
        }, (builtShader: Shader | null) => {
            if (builtShader === null) {
                throw new Error("Failed to load or build the squares shader.");
            }
            this.circlesShader = builtShader;
        });
    }

    public get isReady(): boolean {
        return this.linesShader !== null && this.squaresShader !== null && this.circlesShader !== null;
    }

    protected clearCanvas(color: Color): void {
        gl.clearColor(color.r / 255, color.g / 255, color.b / 255, 1); // TODO avoid doing this if possible
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public initialize(backgroundColor: Color): void {
        super.initialize(backgroundColor);
        gl.viewport(0, 0, this._size.width, this._size.height);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public drawSquares(squares: PatternSquare[]): void {
        this.drawAsPoints(this.squaresShader, squares);
    }

    public drawCircles(circles: PatternCircle[]): void {
        this.drawAsPoints(this.circlesShader, circles);
    }

    private drawAsPoints(shader: Shader, items: PatternBase[]): void {
        const nbCircles = items.length;
        if (shader !== null && nbCircles > 0) {
            const wantedPositionsBufferLength = 2 * nbCircles;
            if (this.positionsBuffer.length !== wantedPositionsBufferLength) {
                this.positionsBuffer = new Float32Array(wantedPositionsBufferLength);
            }

            const wantedSizesBufferLength = nbCircles;
            if (this.sizesBuffer.length !== wantedSizesBufferLength) {
                this.sizesBuffer = new Float32Array(wantedSizesBufferLength);
            }

            const wantedColorsBufferLength = 4 * nbCircles;
            if (this.colorsBuffer.length !== wantedColorsBufferLength) {
                this.colorsBuffer = new Float32Array(wantedColorsBufferLength);
            }

            for (let i = 0; i < nbCircles; i++) {
                this.positionsBuffer[2 * i + 0] = items[i].center.x;
                this.positionsBuffer[2 * i + 1] = items[i].center.y;
                this.sizesBuffer[i] = items[i].size;
                this.colorsBuffer[4 * i + 0] = items[i].color.r / 255;
                this.colorsBuffer[4 * i + 1] = items[i].color.g / 255;
                this.colorsBuffer[4 * i + 2] = items[i].color.b / 255;
                this.colorsBuffer[4 * i + 3] = items[i].needInitialization ? 0 : 1;
            }

            this.positionsVBO.setData(this.positionsBuffer);
            this.sizesVBO.setData(this.sizesBuffer);
            this.colorsVBO.setData(this.colorsBuffer);

            shader.a["aCoords"].VBO = this.positionsVBO;
            shader.a["aSize"].VBO = this.sizesVBO;
            shader.a["aColor"].VBO = this.colorsVBO;
            shader.u["uScreenSize"].value = [this._size.width, this._size.height];

            shader.use();
            shader.bindUniformsAndAttributes();
            gl.drawArrays(gl.POINTS, 0, nbCircles);
        }
    }

    public initializeLinesDrawing(color: Color): void {
        this.linesBuffer.length = 0;
        this.linesColor = color;
    }

    public drawLine(from: IPoint, to: IPoint): void {
        this.linesBuffer.push(from.x, from.y);
        this.linesBuffer.push(to.x, to.y);
    }

    public finalizeLinesDrawing(): void {
        const nbLines = Math.floor(this.linesBuffer.length / 4);

        if (this.linesShader !== null && nbLines >= 1) {
            this.linesVBO.setData(new Float32Array(this.linesBuffer));

            this.linesShader.a["aCoords"].VBO = this.linesVBO;
            this.linesShader.u["uScreenSize"].value = [this._size.width, this._size.height];
            this.linesShader.u["uColor"].value = [this.linesColor.r / 255, this.linesColor.g / 255, this.linesColor.b / 255, 1];

            this.linesShader.use();
            this.linesShader.bindUniformsAndAttributes();
            gl.drawArrays(gl.LINES, 0, 2 * nbLines);
        }
    }
}

export { PlotterCanvasWebGL };
