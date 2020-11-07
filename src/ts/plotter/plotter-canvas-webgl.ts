import { IPoint } from "../utils/i-point";
import { Color } from "../utils/color";
import { ISize } from "../utils/i-size";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import { initGL, gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";

import "../page-interface-generated";

class PlotterCanvasWebGL extends PlotterCanvasBase {
    private linesColor: Color;

    private linesShader: Shader | null;
    private readonly linesBuffer: number[];
    private readonly linesVBO: VBO;

    public constructor() {
        super();

        if (!initGL()) {
            throw new Error("Failed to initialize WebGL.");
        }
        console.log(gl.ALIASED_POINT_SIZE_RANGE);

        this.linesColor = new Color(0, 255, 0);
        this.linesShader = null;
        this.linesBuffer = [];
        this.linesVBO = new VBO(gl, new Float32Array(this.linesBuffer), 2, gl.FLOAT, false);

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
    }

    public get isReady(): boolean {
        return this.linesShader !== null;
    }

    // tslint:disable-next-line
    protected clearCanvas(color: Color): void {
        gl.clearColor(color.r / 255, color.g / 255, color.b / 255, 1); // TODO avoid doing this if possible
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // tslint:disable-next-line
    public initialize(backgroundColor: Color): void {
        super.initialize(backgroundColor);
        gl.viewport(0, 0, this._size.width, this._size.height);

    }

    // tslint:disable-next-line:no-empty
    public finalize(): void {}

    // tslint:disable-next-line
    public drawRectangle(center: IPoint, size: ISize, color: Color): void { }
    // tslint:disable-next-line
    public drawCircle(center: IPoint, radius: number, color: Color): void { }

    // tslint:disable-next-line
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

