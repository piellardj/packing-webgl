import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract initialize(): void;
    public abstract finalize(): void;

    public abstract drawRectangle(center: IPoint, size: ISize, color: string): void;
    public drawSquare(center: IPoint, size: number, color: string): void {
        this.drawRectangle(center, {width: size, height: size}, color);
    }

    public abstract drawCircle(center: IPoint, radius: number, color: string): void;

    public abstract drawLine(from: IPoint, to: IPoint, thickness: number, color: string): void;
}

export { PlotterBase }
