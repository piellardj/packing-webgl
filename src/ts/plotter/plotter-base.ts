import { Color } from "../utils/color";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract get isReady(): boolean;

    public abstract initialize(backgroundColor: Color): void;
    public abstract finalize(): void;

    public abstract drawRectangle(center: IPoint, size: ISize, color: Color): void;
    public drawSquare(center: IPoint, size: number, color: Color): void {
        this.drawRectangle(center, {width: size, height: size}, color);
    }

    public abstract drawCircle(center: IPoint, radius: number, color: Color): void;

    /* Lines have  a 1 pixel thickness */
    public abstract initializeLinesDrawing(color: Color): void;
    public abstract drawLine(from: IPoint, to: IPoint): void;
    public abstract finalizeLinesDrawing(): void;
}

export { PlotterBase };

