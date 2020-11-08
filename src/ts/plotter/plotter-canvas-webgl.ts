import { ILine } from "../utils/i-line";
import { Color } from "../utils/color";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import { PatternBase } from "../patterns/pattern-base";
import { PatternCircle } from "../patterns/pattern-circle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternRectangle } from "../patterns/pattern-rectangle";

import { initGL, gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";

import "../page-interface-generated";
import { Parameters } from "../parameters";

class PlotterCanvasWebGL extends PlotterCanvasBase {
    private linesColor: Color;

    private linesShader: Shader | null;
    private squaresShader: Shader | null;
    private circlesShader: Shader | null;
    private rectanglesShader: Shader | null;

    private blending: boolean;

    private linesBuffer: Float32Array;
    private readonly linesVBO: VBO;

    private positionsBuffer: Float32Array;
    private readonly positionsVBO: VBO;

    private sizesBuffer: Float32Array;
    private readonly sizesVBO: VBO;

    private aspectRatiosBuffer: Float32Array;
    private readonly aspectRatiosVBO: VBO;

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
        this.rectanglesShader = null;

        this.blending = false;
        this.enableBlending = true;

        this.linesBuffer = new Float32Array([]);
        this.linesVBO = new VBO(gl, new Float32Array(this.linesBuffer), 2, gl.FLOAT, false);

        this.positionsBuffer = new Float32Array([]);
        this.positionsVBO = new VBO(gl, this.positionsBuffer, 2, gl.FLOAT, false);

        this.sizesBuffer = new Float32Array([]);
        this.sizesVBO = new VBO(gl, this.sizesBuffer, 1, gl.FLOAT, false);

        this.aspectRatiosBuffer = new Float32Array([]);
        this.aspectRatiosVBO = new VBO(gl, this.aspectRatiosBuffer, 1, gl.FLOAT, false);

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
                throw new Error("Failed to load or build the circles shader.");
            }
            this.circlesShader = builtShader;
        });

        ShaderManager.buildShader({
            vertexFilename: "rectangles.vert",
            fragmentFilename: "rectangles.frag",
            injected: {},
        }, (builtShader: Shader | null) => {
            if (builtShader === null) {
                throw new Error("Failed to load or build the rectangles shader.");
            }
            this.rectanglesShader = builtShader;
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

    public drawRectangles(rectangles: PatternRectangle[]): void {
        const nbRectangles = rectangles.length;
        if (this.rectanglesShader !== null && nbRectangles > 0) {
            // try not to resize the buffers too often to avoid GC
            const roundNbRectangles = 1024 * Math.ceil(nbRectangles / 1024);
            const wantedPositionsBufferLength = 2 * roundNbRectangles;
            if (this.positionsBuffer.length !== wantedPositionsBufferLength) {
                this.positionsBuffer = new Float32Array(wantedPositionsBufferLength);
            }

            const wantedSizesBufferLength = roundNbRectangles;
            if (this.sizesBuffer.length !== wantedSizesBufferLength) {
                this.sizesBuffer = new Float32Array(wantedSizesBufferLength);
            }

            const wantedAspectRatiosBufferLength = roundNbRectangles;
            if (this.aspectRatiosBuffer.length !== wantedAspectRatiosBufferLength) {
                this.aspectRatiosBuffer = new Float32Array(wantedAspectRatiosBufferLength);
            }

            const wantedColorsBufferLength = 4 * roundNbRectangles;
            if (this.colorsBuffer.length !== wantedColorsBufferLength) {
                this.colorsBuffer = new Float32Array(wantedColorsBufferLength);
            }

            this.enableBlending = Parameters.blending;
            const time = performance.now();
            const blendTime = PatternBase.maxBlendingTime;
            for (let i = 0; i < nbRectangles; i++) {
                this.positionsBuffer[2 * i + 0] = rectangles[i].center.x;
                this.positionsBuffer[2 * i + 1] = rectangles[i].center.y;
                this.sizesBuffer[i] = rectangles[i].size;
                this.aspectRatiosBuffer[i] = rectangles[i].aspectRatio;
                this.colorsBuffer[4 * i + 0] = rectangles[i].color.r / 255;
                this.colorsBuffer[4 * i + 1] = rectangles[i].color.g / 255;
                this.colorsBuffer[4 * i + 2] = rectangles[i].color.b / 255;
                this.colorsBuffer[4 * i + 3] = rectangles[i].computeOpacity(time, blendTime);
            }

            this.positionsVBO.setData(this.positionsBuffer);
            this.sizesVBO.setData(this.sizesBuffer);
            this.aspectRatiosVBO.setData(this.aspectRatiosBuffer);
            this.colorsVBO.setData(this.colorsBuffer);

            this.rectanglesShader.a["aCoords"].VBO = this.positionsVBO;
            this.rectanglesShader.a["aSize"].VBO = this.sizesVBO;
            this.rectanglesShader.a["aAspectRatio"].VBO = this.aspectRatiosVBO;
            this.rectanglesShader.a["aColor"].VBO = this.colorsVBO;
            this.rectanglesShader.u["uScreenSize"].value = [this._size.width, this._size.height];

            this.rectanglesShader.use();
            this.rectanglesShader.bindUniformsAndAttributes();
            gl.drawArrays(gl.POINTS, 0, nbRectangles);
        }
    }

    private drawAsPoints(shader: Shader, items: PatternBase[]): void {
        const nbCircles = items.length;
        if (shader !== null && nbCircles > 0) {
            // try not to resize the buffers too often to avoid GC
            const roundNbCircles = 1024 * Math.ceil(nbCircles / 1024);
            const wantedPositionsBufferLength = 2 * roundNbCircles;
            if (this.positionsBuffer.length !== wantedPositionsBufferLength) {
                this.positionsBuffer = new Float32Array(wantedPositionsBufferLength);
            }

            const wantedSizesBufferLength = roundNbCircles;
            if (this.sizesBuffer.length !== wantedSizesBufferLength) {
                this.sizesBuffer = new Float32Array(wantedSizesBufferLength);
            }

            const wantedColorsBufferLength = 4 * roundNbCircles;
            if (this.colorsBuffer.length !== wantedColorsBufferLength) {
                this.colorsBuffer = new Float32Array(wantedColorsBufferLength);
            }

            this.enableBlending = Parameters.blending;
            const time = performance.now();
            const blendTime = PatternBase.maxBlendingTime;
            for (let i = 0; i < nbCircles; i++) {
                this.positionsBuffer[2 * i + 0] = items[i].center.x;
                this.positionsBuffer[2 * i + 1] = items[i].center.y;
                this.sizesBuffer[i] = items[i].size;
                this.colorsBuffer[4 * i + 0] = items[i].color.r / 255;
                this.colorsBuffer[4 * i + 1] = items[i].color.g / 255;
                this.colorsBuffer[4 * i + 2] = items[i].color.b / 255;
                this.colorsBuffer[4 * i + 3] = items[i].computeOpacity(time, blendTime);
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

    public drawLines(lines: ILine[], color: Color): void {
        const nbLines = lines.length;

        if (this.linesShader !== null && nbLines >= 1) {
            const wantedLinesBufferLength = 4 * nbLines;
            if (this.linesBuffer.length !== wantedLinesBufferLength) {
                this.linesBuffer = new Float32Array(wantedLinesBufferLength)
            }

            for (let i = 0; i < nbLines; i++) {
                this.linesBuffer[4 * i + 0] = lines[i].from.x;
                this.linesBuffer[4 * i + 1] = lines[i].from.y;
                this.linesBuffer[4 * i + 2] = lines[i].to.x;
                this.linesBuffer[4 * i + 3] = lines[i].to.y;
            }

            this.linesVBO.setData(new Float32Array(this.linesBuffer));

            this.linesShader.a["aCoords"].VBO = this.linesVBO;
            this.linesShader.u["uScreenSize"].value = [this._size.width, this._size.height];
            this.linesShader.u["uColor"].value = [this.linesColor.r / 255, this.linesColor.g / 255, this.linesColor.b / 255, 1];

            this.linesShader.use();
            this.linesShader.bindUniformsAndAttributes();
            gl.drawArrays(gl.LINES, 0, 2 * nbLines);
        }
    }

    private set enableBlending(value: boolean) {
        if (value !== this.blending) {
            this.blending = value;

            if (value) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            } else {
                gl.disable(gl.BLEND);
            }
        }
    }
}

export { PlotterCanvasWebGL };
