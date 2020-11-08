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

type AffectShaderFunction = (shader: Shader) => unknown;
type ExtraAttributeFunction = (item: PatternBase) => number;

class PlotterCanvasWebGL extends PlotterCanvasBase {
    private instancingExt: ANGLE_instanced_arrays;
    private needToResetInstancingDivision: boolean;

    private linesColor: Color;

    private linesShader: Shader | null;
    private squaresShader: Shader | null;
    private circlesShader: Shader | null;
    private rectanglesShader: Shader | null;

    private squaresInstancedShader: Shader | null;
    private circlesInstancedShader: Shader | null;
    private rectanglesInstancedShader: Shader | null;

    private blending: boolean;

    private linesBuffer: Float32Array;
    private readonly linesVBO: VBO;

    private statesBuffer: Float32Array;
    private readonly statesVBO: VBO;

    private colorsBuffer: Float32Array;
    private readonly colorsVBO: VBO;

    private readonly geometryVBO: VBO;

    public constructor() {
        super();

        if (!initGL()) {
            throw new Error("Failed to initialize WebGL.");
        }
        console.log(`Max point size supported by WebGL: "${gl.ALIASED_POINT_SIZE_RANGE}" pixels.`);

        this.needToResetInstancingDivision = false;
        const instancingExtensionName = "ANGLE_instanced_arrays";
        this.instancingExt = gl.getExtension(instancingExtensionName);
        if (this.instancingExt === null) {
            const errorMessage = `Your device does not support the "${instancingExtensionName}" WebGL extension. Using the fallback mode with GL_POINTS, which might cause visual artifacts.`;
            Page.Demopage.setErrorMessage("webgl-instanced", errorMessage);
            console.log(errorMessage);
            Parameters.disallowInstancing();
        } else {
            console.log(`Using the "${instancingExtensionName}" WebGL extension.`);
        }

        this.linesColor = new Color(0, 255, 0);

        this.blending = false;
        this.enableBlending = true;

        this.linesBuffer = new Float32Array([]);
        this.linesVBO = new VBO(gl, new Float32Array(this.linesBuffer), 2, gl.FLOAT, false);

        this.statesBuffer = new Float32Array([]);
        this.statesVBO = new VBO(gl, this.statesBuffer, 4, gl.FLOAT, false);

        this.colorsBuffer = new Float32Array([]);
        this.colorsVBO = new VBO(gl, this.colorsBuffer, 4, gl.FLOAT, false);

        const squareGeometryBuffer = [-.5, .5, -.5, -.5, .5, .5, .5, -.5];
        this.geometryVBO = new VBO(gl, new Float32Array(squareGeometryBuffer), 2, gl.FLOAT, true);

        this.linesShader = null;
        this.squaresShader = null;
        this.circlesShader = null;
        this.rectanglesShader = null;
        this.loadAndBuildShader("lines.vert", "lines.frag", "lines", (shader: Shader) => this.linesShader = shader);
        this.loadAndBuildShader("items.vert", "squares.frag", "squares", (shader: Shader) => this.squaresShader = shader);
        this.loadAndBuildShader("items.vert", "circles.frag", "circles", (shader: Shader) => this.circlesShader = shader);
        this.loadAndBuildShader("rectangles.vert", "rectangles.frag", "rectangles", (shader: Shader) => this.rectanglesShader = shader);

        this.squaresInstancedShader = null;
        this.circlesInstancedShader = null;
        this.rectanglesInstancedShader = null;
        if (this.supportsInstancing) {
            this.loadAndBuildShader("instanced/simpleGeometry.vert", "instanced/fillColor.frag", "instanced squares", (shader: Shader) => this.squaresInstancedShader = shader);
            this.loadAndBuildShader("instanced/circles.vert", "instanced/circles.frag", "instanced squares", (shader: Shader) => this.circlesInstancedShader = shader);
            this.loadAndBuildShader("instanced/rectangles.vert", "instanced/fillColor.frag", "instanced circles", (shader: Shader) => this.rectanglesInstancedShader = shader);
        }
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
        if (this.useInstancing && this.squaresInstancedShader !== null) {
            this.drawInstanced(this.squaresInstancedShader, squares);
        } else {
            this.drawAsPoints(this.squaresShader, squares);
        }
    }

    public drawCircles(circles: PatternCircle[]): void {
        if (this.useInstancing && this.circlesInstancedShader !== null) {
            this.drawInstanced(this.circlesInstancedShader, circles);
        } else {
            this.drawAsPoints(this.circlesShader, circles);
        }
    }

    public drawRectangles(rectangles: PatternRectangle[]): void {
        const extraAttributeFunction = (item: PatternBase) => (item as PatternRectangle).aspectRatio;

        if (this.useInstancing && this.rectanglesInstancedShader !== null) {
            this.drawInstanced(this.rectanglesInstancedShader, rectangles, extraAttributeFunction);
        } else {
            this.drawAsPoints(this.rectanglesShader, rectangles, extraAttributeFunction);
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

    private drawInstanced(shader: Shader, items: PatternBase[], extraAttribute?: ExtraAttributeFunction): void {
        const nbItems = items.length;
        if (this.supportsInstancing && shader !== null && nbItems > 0) {
            this.updateStateAndColorVBOs(items, extraAttribute);

            shader.u["uScreenSize"].value = [this._size.width, this._size.height];

            shader.use();
            shader.bindUniforms();

            this.geometryVBO.bind(shader.a["aVertex"].loc);
            this.statesVBO.bindInstanced(shader.a["aState"].loc, this.instancingExt, 1);
            this.colorsVBO.bindInstanced(shader.a["aColor"].loc, this.instancingExt, 1);
            this.needToResetInstancingDivision = true;

            this.instancingExt.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, nbItems);
        }
    }

    private drawAsPoints(shader: Shader, items: PatternBase[], extraAttribute?: ExtraAttributeFunction): void {
        const nbItems = items.length;
        if (shader !== null && nbItems > 0) {
            this.updateStateAndColorVBOs(items, extraAttribute);

            shader.a["aState"].VBO = this.statesVBO;
            shader.a["aColor"].VBO = this.colorsVBO;
            shader.u["uScreenSize"].value = [this._size.width, this._size.height];

            shader.use();

            if (this.needToResetInstancingDivision) {
                this.statesVBO.bindInstanced(shader.a["aState"].loc, this.instancingExt, 0);
                this.colorsVBO.bindInstanced(shader.a["aColor"].loc, this.instancingExt, 0);
                this.needToResetInstancingDivision = false;
            }

            shader.bindUniformsAndAttributes();
            gl.drawArrays(gl.POINTS, 0, nbItems);
        }
    }

    private updateStateAndColorVBOs(items: PatternBase[], extraAttribute?: ExtraAttributeFunction): void {
        const nbItems = items.length;

        // try not to resize the buffers too often to avoid GC
        const nbItemsRounded = 1024 * Math.ceil(nbItems / 1024);

        const wantedStatesBufferLength = 4 * nbItemsRounded;
        if (this.statesBuffer.length !== wantedStatesBufferLength) {
            this.statesBuffer = new Float32Array(wantedStatesBufferLength);
        }

        const wantedColorsBufferLength = 4 * nbItemsRounded;
        if (this.colorsBuffer.length !== wantedColorsBufferLength) {
            this.colorsBuffer = new Float32Array(wantedColorsBufferLength);
        }

        this.enableBlending = Parameters.blending;
        const time = performance.now();
        const blendTime = PatternBase.maxBlendingTime;

        if (typeof extraAttribute === "function") {
            for (let i = 0; i < nbItems; i++) {
                this.statesBuffer[4 * i + 0] = items[i].center.x;
                this.statesBuffer[4 * i + 1] = items[i].center.y;
                this.statesBuffer[4 * i + 2] = items[i].size;
                this.statesBuffer[4 * i + 3] = extraAttribute(items[i]);
                this.colorsBuffer[4 * i + 0] = items[i].color.r / 255;
                this.colorsBuffer[4 * i + 1] = items[i].color.g / 255;
                this.colorsBuffer[4 * i + 2] = items[i].color.b / 255;
                this.colorsBuffer[4 * i + 3] = items[i].computeOpacity(time, blendTime);
            }
        } else {
            for (let i = 0; i < nbItems; i++) {
                this.statesBuffer[4 * i + 0] = items[i].center.x;
                this.statesBuffer[4 * i + 1] = items[i].center.y;
                this.statesBuffer[4 * i + 2] = items[i].size;
                // unused this.statesBuffer[4 * i + 3]
                this.colorsBuffer[4 * i + 0] = items[i].color.r / 255;
                this.colorsBuffer[4 * i + 1] = items[i].color.g / 255;
                this.colorsBuffer[4 * i + 2] = items[i].color.b / 255;
                this.colorsBuffer[4 * i + 3] = items[i].computeOpacity(time, blendTime);
            }
        }

        this.statesVBO.setData(this.statesBuffer);
        this.colorsVBO.setData(this.colorsBuffer);
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

    private loadAndBuildShader(vertexFilename: string, fragmentFilename: string, shaderName: string, affectShader: AffectShaderFunction): void {
        ShaderManager.buildShader({
            vertexFilename,
            fragmentFilename,
            injected: {},
        }, (builtShader: Shader | null) => {
            if (builtShader === null) {
                const errorMessage = `Failed to load or build the ${shaderName} shader.`;
                Page.Demopage.setErrorMessage(`shader-${shaderName}`, errorMessage);
                throw new Error(errorMessage);
            }
            affectShader(builtShader);
        });
    }

    private get supportsInstancing(): boolean {
        return this.instancingExt !== null;
    }

    private get useInstancing(): boolean {
        return this.supportsInstancing && Parameters.useInstancing;
    }
}

export { PlotterCanvasWebGL };
