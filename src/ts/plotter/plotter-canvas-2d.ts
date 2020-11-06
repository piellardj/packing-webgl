import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";
import { PlotterCanvasBase } from "./plotter-canvas-base";

import "../page-interface-generated";

class PlotterCanvas2D extends PlotterCanvasBase {
    private readonly context: CanvasRenderingContext2D;
    public constructor() {
        super();
        this.context = this.canvas.getContext("2d", { alpha: false });
    }

    protected clearCanvas(color: string): void {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public drawRectangle(center: IPoint, size: ISize, color: string): void {
        const centerX = center.x + 0.5 * this._size.width;
        const centerY = center.y + 0.5 * this._size.height;

        this.context.fillStyle = color;
        this.context.fillRect(centerX - 0.5 * size.width, centerY - 0.5 * size.height, size.width, size.height);
    }

    public drawCircle(center: IPoint, radius: number, color: string): void {
        const centerX = center.x + 0.5 * this._size.width;
        const centerY = center.y + 0.5 * this._size.height;

        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.context.fill();
        this.context.closePath();
    }

    public drawLine(from: IPoint, to: IPoint, thickness: number, color: string): void {
        this.context.fillStyle = "none";
        this.context.strokeStyle = color;
        this.context.lineWidth = thickness;

        this.context.beginPath();
        this.context.moveTo(from.x + 0.5 * this._size.width, from.y + 0.5 * this._size.height);
        this.context.lineTo(to.x + 0.5 * this._size.width, to.y + 0.5 * this._size.height);
        this.context.stroke();
        this.context.closePath();

        this.context.strokeStyle = "none";
    }
}

export { PlotterCanvas2D };

