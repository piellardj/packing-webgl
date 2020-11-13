import { Color } from "../color/color";
import { ILine } from "../utils/i-line";

import { PlotterCanvasBase } from "./plotter-canvas-base";

import { PatternCircle } from "../patterns/pattern-circle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternRectangle } from "../patterns/pattern-rectangle";
import { PatternTriangle } from "../patterns/pattern-triangle";

import "../page-interface-generated";

class PlotterCanvas2D extends PlotterCanvasBase {
    private readonly context: CanvasRenderingContext2D;
    public constructor() {
        super();
        this.context = this.canvas.getContext("2d", { alpha: false });
    }

    public get isReady(): boolean {
        return true;
    }

    protected clearCanvas(color: Color): void {
        this.context.fillStyle = color.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public drawSquares(squares: PatternSquare[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        for (const square of squares) {
            const centerX = square.center.x + halfWidth;
            const centerY = square.center.y + halfHeight;
            const halfSize = 0.5 * square.size;

            this.context.fillStyle = square.color.toString();
            this.context.fillRect(centerX - halfSize, centerY - halfSize, square.size, square.size);
        }
    }

    public drawCircles(circles: PatternCircle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;
        const TWO_PI = 2 * Math.PI;

        for (const circle of circles) {
            const centerX = circle.center.x + halfWidth;
            const centerY = circle.center.y + halfHeight;

            this.context.fillStyle = circle.color.toString();
            this.context.beginPath();
            this.context.arc(centerX, centerY, circle.radius, 0, TWO_PI);
            this.context.fill();
            this.context.closePath();
        }
    }

    public drawRectangles(rectangles: PatternRectangle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        for (const rectangle of rectangles) {
            const centerX = rectangle.center.x + halfWidth;
            const centerY = rectangle.center.y + halfHeight;

            this.context.fillStyle = rectangle.color.toString();
            this.context.fillRect(centerX - 0.5 * rectangle.width, centerY - 0.5 * rectangle.height, rectangle.width, rectangle.height);
        }
    }

    public drawTriangles(triangles: PatternTriangle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        for (const triangle of triangles) {
            const centerX = triangle.center.x + halfWidth;
            const centerY = triangle.center.y + halfHeight;

            this.context.fillStyle = triangle.color.toString();
            this.context.beginPath();
            this.context.moveTo(centerX + triangle.P1.x * triangle.size, centerY + triangle.P1.y * triangle.size);
            this.context.lineTo(centerX + triangle.P2.x * triangle.size, centerY + triangle.P2.y * triangle.size);
            this.context.lineTo(centerX + triangle.P3.x * triangle.size, centerY + triangle.P3.y * triangle.size);
            this.context.fill();
            this.context.closePath();
        }
    }

    public drawLines(lines: ILine[], color: Color): void {
        this.context.fillStyle = "none";
        this.context.strokeStyle = color.toString();
        this.context.lineWidth = 1;
        this.context.beginPath();

        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;
        for (const line of lines) {
            this.context.moveTo(line.from.x + halfWidth, line.from.y + halfHeight);
            this.context.lineTo(line.to.x + halfWidth, line.to.y + halfHeight);
        }

        this.context.stroke();
        this.context.closePath();
        this.context.strokeStyle = "none";
    }
}

export { PlotterCanvas2D };

