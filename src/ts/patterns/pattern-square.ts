import { IPoint } from "../interfaces/i-point";
// import { ISize } from "../interfaces/i-size";
import { PlotterBase } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

class PatternSquare extends PatternBase {
    private readonly center: IPoint;
    private sideLength: number; // length of a side

    public constructor(center: IPoint, sideLength: number, color: string) {
        super(color);

        this.center = {
            x: center.x,
            y: center.y,
        }

        this.sideLength = sideLength;
    }

    public draw(plotter: PlotterBase): void {
        plotter.drawSquare(this.center, this.sideLength, this.color);
    }

    public zoomIn(zoomFactor: number): void {
        this.center.x *= zoomFactor;
        this.center.y *= zoomFactor;
        this.sideLength *= zoomFactor;
    }

    public static computeBiggestSideLengthPossible(center: IPoint, existingItems: PatternSquare[]): number {
        const maxSizeX = Math.abs(center.x);
        const maxSizeY = Math.abs(center.y);
        let maxSize = Math.max(maxSizeX, maxSizeY); // avoid center of the canvas

        for (const item of existingItems) {
            maxSize = Math.min(maxSize, PatternSquare.computeDistanceToEdge(center, item));
        }

        return 2 * maxSize;
    }

    private static computeDistanceToEdge(center: IPoint, obstacle: PatternSquare): number {
        const deltaX = Math.abs(center.x - obstacle.center.x);
        const deltaY = Math.abs(center.y - obstacle.center.y);

        if (deltaX < 0.5 * obstacle.sideLength) {
            if (deltaY < 0.5 * obstacle.sideLength) {
                return Math.min(0.5 * obstacle.sideLength - deltaX, 0.5 * obstacle.sideLength - deltaY);
            } else {
                return deltaY - 0.5 * obstacle.sideLength;
            }
        } else {
            if (deltaY < 0.5 * obstacle.sideLength) {
                return deltaX - 0.5 * obstacle.sideLength;
            } else {
                return Math.max(deltaX - 0.5 * obstacle.sideLength, deltaY - 0.5 * obstacle.sideLength);
            }
        }
    }
}

export { PatternSquare }
