import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract initialize(): void;
    public abstract finalize(): void;

    public abstract drawRectangle(center: IPoint, size: ISize, color: string): void;
    public drawSquare(center: IPoint, size: number, color: string): void {
        this.drawRectangle(center, {width: size, height: size}, color);
    }

    public abstract drawCircle(center: IPoint, radius: number, color: string): void;
}

export { PlotterBase }
