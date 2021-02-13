import { Color } from "../color/color";

import { gl, initGL } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";

import { EPrimitive, Parameters } from "../parameters";

import { PatternBase } from "../patterns/pattern-base";
import { PatternCircle } from "../patterns/pattern-circle";
import { PatternHeart } from "../patterns/pattern-heart";
import { PatternRectangle } from "../patterns/pattern-rectangle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternTriangle } from "../patterns/pattern-triangle";

import * as Statistics from "../statistics/statistics";

import { ILine } from "../utils/i-line";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import "../page-interface-generated";

type AffectShaderFunction = (shader: Shader) => unknown;
type ExtraAttributeFunction = (item: PatternBase) => number;

const SQUARE_GEOMETRY = [-.5, .5, -.5, -.5, .5, .5, .5, -.5];
const TRIANGLE_GEOMETRY = [
    PatternTriangle.baseP1.x, PatternTriangle.baseP1.y,
    PatternTriangle.baseP2.x, PatternTriangle.baseP2.y,
    PatternTriangle.baseP3.x, PatternTriangle.baseP3.y,
];

class PlotterCanvasWebGL extends PlotterCanvasBase {
    private instancingExt: ANGLE_instanced_arrays;
    private needToResetInstancingDivision: boolean;

    private linesShader: Shader | null;

    private squaresShader: Shader | null;
    private circlesShader: Shader | null;
    private rectanglesShader: Shader | null;
    private trianglesShader: Shader | null;
    private heartsShader: Shader | null;

    private squaresInstancedShader: Shader | null;
    private circlesInstancedShader: Shader | null;
    private rectanglesInstancedShader: Shader | null;
    private trianglesInstancedShader: Shader | null;
    private heartsInstancedShader: Shader | null;

    private blending: boolean;

    private linesBuffer: Float32Array;
    private readonly linesVBO: VBO;

    private primitivesBuffer: Float32Array;
    private readonly primitivesVBOId: WebGLBuffer;

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

        this.blending = false;
        this.enableBlending = true;

        this.linesBuffer = new Float32Array([]);
        this.linesVBO = new VBO(gl, new Float32Array(this.linesBuffer), 2, gl.FLOAT, false);

        this.primitivesBuffer = new Float32Array([]);
        this.primitivesVBOId = gl.createBuffer();

        const geometryBuffer = SQUARE_GEOMETRY.concat(TRIANGLE_GEOMETRY);
        this.geometryVBO = new VBO(gl, new Float32Array(geometryBuffer), 2, gl.FLOAT, true);

        this.linesShader = null;
        this.squaresShader = null;
        this.circlesShader = null;
        this.rectanglesShader = null;
        this.trianglesShader = null;
        this.heartsShader = null;
        this.loadAndBuildShader("point/lines.vert", "point/lines.frag", "lines", (shader: Shader) => this.linesShader = shader);
        this.loadAndBuildShader("point/items.vert", "point/squares.frag", "squares", (shader: Shader) => this.squaresShader = shader);
        this.loadAndBuildShader("point/items.vert", "point/circles.frag", "circles", (shader: Shader) => this.circlesShader = shader);
        this.loadAndBuildShader("point/rectangles.vert", "point/rectangles.frag", "rectangles", (shader: Shader) => this.rectanglesShader = shader);
        this.loadAndBuildShader("point/triangles.vert", "point/triangles.frag", "triangles", (shader: Shader) => this.trianglesShader = shader);
        this.loadAndBuildShader("point/items.vert", "point/hearts.frag", "hearts", (shader: Shader) => this.heartsShader = shader);

        this.squaresInstancedShader = null;
        this.circlesInstancedShader = null;
        this.rectanglesInstancedShader = null;
        this.trianglesInstancedShader = null;
        this.heartsInstancedShader = null;
        if (this.supportsInstancing) {
            this.loadAndBuildShader("instanced/simpleGeometry.vert", "instanced/fillColor.frag", "instanced squares", (shader: Shader) => this.squaresInstancedShader = shader);
            this.loadAndBuildShader("instanced/squareToDiscard.vert", "instanced/circles.frag", "instanced squares", (shader: Shader) => this.circlesInstancedShader = shader);
            this.loadAndBuildShader("instanced/rectangles.vert", "instanced/fillColor.frag", "instanced circles", (shader: Shader) => this.rectanglesInstancedShader = shader);
            this.loadAndBuildShader("instanced/triangles.vert", "instanced/fillColor.frag", "instanced triangles", (shader: Shader) => this.trianglesInstancedShader = shader);
            this.loadAndBuildShader("instanced/squareToDiscard.vert", "instanced/hearts.frag", "instanced hearts", (shader: Shader) => this.heartsInstancedShader = shader);
        }
    }

    public get isReady(): boolean {
        return this.linesShader !== null &&
            this.squaresShader !== null && this.circlesShader !== null && this.rectanglesShader !== null && this.trianglesShader !== null &&
            this.squaresInstancedShader !== null && this.circlesInstancedShader !== null && this.rectanglesInstancedShader !== null && this.trianglesInstancedShader !== null;
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
        this.drawPrimitives(this.squaresShader, this.squaresInstancedShader, squares, EPrimitive.SQUARE);
    }

    public drawCircles(circles: PatternCircle[]): void {
        this.drawPrimitives(this.circlesShader, this.circlesInstancedShader, circles, EPrimitive.CIRCLE);
    }

    public drawRectangles(rectangles: PatternRectangle[]): void {
        const extraAttributeFunction = (item: PatternBase) => (item as PatternRectangle).aspectRatio;
        this.drawPrimitives(this.rectanglesShader, this.rectanglesInstancedShader, rectangles, EPrimitive.RECTANGLE, extraAttributeFunction);
    }

    public drawTriangles(triangles: PatternTriangle[]): void {
        const extraAttributeFunction = (item: PatternBase) => (item as PatternTriangle).angle;
        this.drawPrimitives(this.trianglesShader, this.trianglesInstancedShader, triangles, EPrimitive.TRIANGLE, extraAttributeFunction);
    }

    public drawHearts(hearts: PatternHeart[]): void {
        this.drawPrimitives(this.heartsShader, this.heartsInstancedShader, hearts, EPrimitive.HEART);
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
            this.linesShader.u["uColor"].value = [color.r / 255, color.g / 255, color.b / 255, 1];

            this.linesShader.use();
            this.linesShader.bindUniformsAndAttributes();
            gl.drawArrays(gl.LINES, 0, 2 * nbLines);
        }
    }

    private drawPrimitives(pointsShader: Shader, instancedShader: Shader, items: PatternBase[], primitive: EPrimitive, extraAttributeFunction?: ExtraAttributeFunction): void {
        this.updatePrimitivesVBO(items, extraAttributeFunction);

        Statistics.timeSpentInDrawDrawX.start();
        if (this.useInstancing && instancedShader !== null) {
            this.drawInstanced(instancedShader, items, primitive);
        } else {
            this.drawAsPoints(pointsShader, items);
        }
        Statistics.timeSpentInDrawDrawX.stop();
    }

    private drawInstanced(shader: Shader, items: PatternBase[], primitive: EPrimitive): void {
        const nbItems = items.length;
        if (this.supportsInstancing && shader !== null && nbItems > 0) {
            shader.use();
            this.bindCommonUniformsAndAttributes(shader, true);
            this.geometryVBO.bind(shader.a["aVertex"].loc);

            if (primitive === EPrimitive.TRIANGLE) {
                this.instancingExt.drawArraysInstancedANGLE(gl.TRIANGLES, 4, 3, nbItems);
            } else {
                this.instancingExt.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, nbItems);
            }
        }
    }

    private drawAsPoints(shader: Shader, items: PatternBase[]): void {
        const nbItems = items.length;
        if (shader !== null && nbItems > 0) {
            shader.use();
            this.bindCommonUniformsAndAttributes(shader, false);

            gl.drawArrays(gl.POINTS, 0, nbItems);
        }
    }

    private updatePrimitivesVBO(items: PatternBase[], extraAttribute?: ExtraAttributeFunction): void {
        const nbItems = items.length;

        Statistics.timeSpentInDrawAllocateBuffer.start();
        // try not to resize the buffers too often to avoid GC
        const nbItemsRounded = 1024 * Math.ceil(nbItems / 1024);

        const wantedPrimitivesBufferLength = 8 * nbItemsRounded;
        if (this.primitivesBuffer.length !== wantedPrimitivesBufferLength) {
            this.primitivesBuffer = new Float32Array(wantedPrimitivesBufferLength);
        }
        Statistics.timeSpentInDrawAllocateBuffer.stop();

        this.enableBlending = Parameters.blending;
        const time = performance.now();
        const blendTime = PatternBase.maxBlendingTime;

        if (typeof extraAttribute !== "function") {
            extraAttribute = () => 0; // unused value
        }

        Statistics.timeSpentInDrawFillBuffer.start();
        for (let i = 0; i < nbItems; i++) {
            const color = items[i].color;

            this.primitivesBuffer[8 * i + 0] = items[i].center.x;
            this.primitivesBuffer[8 * i + 1] = items[i].center.y;
            this.primitivesBuffer[8 * i + 2] = items[i].size;
            this.primitivesBuffer[8 * i + 3] = extraAttribute(items[i]);
            this.primitivesBuffer[8 * i + 4] = color.r / 255;
            this.primitivesBuffer[8 * i + 5] = color.g / 255;
            this.primitivesBuffer[8 * i + 6] = color.b / 255;
            this.primitivesBuffer[8 * i + 7] = items[i].computeOpacity(time, blendTime);
        }
        Statistics.timeSpentInDrawFillBuffer.stop();

        Statistics.timeSpentInDrawUploadVBO.start();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitivesVBOId);
        gl.bufferData(gl.ARRAY_BUFFER, this.primitivesBuffer, gl.DYNAMIC_DRAW);
        Statistics.timeSpentInDrawUploadVBO.stop();
    }

    private bindCommonUniformsAndAttributes(shader: Shader, instanced: boolean): void {
        shader.u["uScreenSize"].value = [this._size.width, this._size.height];
        shader.bindUniforms();

        const BYTES_PER_FLOAT = 4;
        const stateAttribLoc = shader.a["aState"].loc;
        const colorAttribLoc = shader.a["aColor"].loc;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitivesVBOId);
        gl.enableVertexAttribArray(stateAttribLoc);
        gl.vertexAttribPointer(stateAttribLoc, 4, gl.FLOAT, false, 8 * BYTES_PER_FLOAT, 0);
        if (instanced) {
            this.instancingExt.vertexAttribDivisorANGLE(stateAttribLoc, 1);
        } else if (this.needToResetInstancingDivision) {
            this.instancingExt.vertexAttribDivisorANGLE(stateAttribLoc, 0);
        }

        gl.enableVertexAttribArray(colorAttribLoc);
        gl.vertexAttribPointer(colorAttribLoc, 4, gl.FLOAT, false, 8 * BYTES_PER_FLOAT, 4 * BYTES_PER_FLOAT);
        if (instanced) {
            this.instancingExt.vertexAttribDivisorANGLE(colorAttribLoc, 1);
        } else if (this.needToResetInstancingDivision) {
            this.instancingExt.vertexAttribDivisorANGLE(colorAttribLoc, 0);
        }

        this.needToResetInstancingDivision = instanced;
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
