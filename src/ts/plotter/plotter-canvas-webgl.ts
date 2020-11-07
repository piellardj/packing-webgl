import { IPoint } from "../utils/i-point";
import { Color } from "../utils/color";
import { ISize } from "../utils/i-size";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import { EPrimitive, Parameters } from "../parameters";

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

    private readonly positionsBuffer: number[];
    private readonly positionsVBO: VBO;

    private readonly sizesBuffer: number[];
    private readonly sizesVBO: VBO;

    private readonly colorsBuffer: number[];
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

        this.positionsBuffer = [];
        this.positionsVBO = new VBO(gl, new Float32Array(this.positionsBuffer), 2, gl.FLOAT, false);

        this.sizesBuffer = [];
        this.sizesVBO = new VBO(gl, new Float32Array(this.sizesBuffer), 1, gl.FLOAT, false);

        this.colorsBuffer = [];
        this.colorsVBO = new VBO(gl, new Float32Array(this.colorsBuffer), 4, gl.FLOAT, false);

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

        this.positionsBuffer.length = 0;
        this.sizesBuffer.length = 0;
        this.colorsBuffer.length = 0;
    }

    public finalize(): void {
        const shader = (Parameters.primitive === EPrimitive.CIRCLE) ? this.circlesShader : this.squaresShader;

        const nbItems = this.sizesBuffer.length;
        if (shader !== null && nbItems > 0) {
            this.positionsVBO.setData(new Float32Array(this.positionsBuffer));
            this.sizesVBO.setData(new Float32Array(this.sizesBuffer));
            this.colorsVBO.setData(new Float32Array(this.colorsBuffer));

            shader.a["aCoords"].VBO = this.positionsVBO;
            shader.a["aSize"].VBO = this.sizesVBO;
            shader.a["aColor"].VBO = this.colorsVBO;
            shader.u["uScreenSize"].value = [this._size.width, this._size.height];

            shader.use();
            shader.bindUniformsAndAttributes();
            gl.drawArrays(gl.POINTS, 0, nbItems);
        }
    }

    public drawRectangle(center: IPoint, size: ISize, color: Color): void {
        this.positionsBuffer.push(center.x, center.y);
        this.sizesBuffer.push(size.width);
        this.colorsBuffer.push(color.r / 255, color.g / 255, color.b / 255, 1);
    }

    public drawCircle(center: IPoint, radius: number, color: Color): void {
        this.positionsBuffer.push(center.x, center.y);
        this.sizesBuffer.push(2 * radius);
        this.colorsBuffer.push(color.r / 255, color.g / 255, color.b / 255, 1);
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

