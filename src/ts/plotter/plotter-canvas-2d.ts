import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";
import { PlotterBase } from "./plotter-base";

import "../page-interface-generated";

class PlotterCanvas2D extends PlotterBase {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly cssPixel: number;
    private _size: ISize;

    public constructor() {
        super();

        this.canvas = Page.Canvas.getCanvas();
        this.context = this.canvas.getContext("2d", { alpha: false });
        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
    }

    public get size(): ISize {
        return this._size;
    }

    public initialize(): void {
        this.resizeCanvas();

        this.context.fillStyle = "black";
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

    private resizeCanvas(): void {
        const actualWidth = Math.floor(this.cssPixel * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.cssPixel * this.canvas.clientHeight);

        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
        }

        this._size = {
            width: this.canvas.width,
            height: this.canvas.height,
        }
    }
}

export { PlotterCanvas2D };

