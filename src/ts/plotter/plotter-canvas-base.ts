import { ISize } from "../utils/i-size";
import { PlotterBase } from "./plotter-base";

import "../page-interface-generated";

abstract class PlotterCanvasBase extends PlotterBase {
    protected readonly canvas: HTMLCanvasElement;
    protected _size: ISize;
    private readonly cssPixel: number;

    public constructor() {
        super();

        this.canvas = Page.Canvas.getCanvas();
        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
    }

    public get size(): ISize {
        return this._size;
    }

    public initialize(): void {
        this.resizeCanvas();
        this.clearCanvas("black");
    }

    protected abstract clearCanvas(color: string): void;

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

export { PlotterCanvasBase };

