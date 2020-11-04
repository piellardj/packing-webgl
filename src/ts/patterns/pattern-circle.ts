import { IPoint } from "../interfaces/i-point";
// import { ISize } from "../interfaces/i-size";
import { PlotterBase } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

class PatternCircle extends PatternBase {
    private readonly center: IPoint;
    private diameter: number;

    public constructor(center: IPoint, diameter: number, color: string) {
        super(color);

        this.center = {
            x: center.x,
            y: center.y,
        }

        this.diameter = diameter;
    }

    public draw(plotter: PlotterBase): void {
        plotter.drawCircle(this.center, 0.5 * this.diameter, this.color);
    }

    public zoomIn(zoomFactor: number): void {
        this.center.x *= zoomFactor;
        this.center.y *= zoomFactor;
        this.diameter *= zoomFactor;
    }

    public static computeBiggestDiameterPossible(center: IPoint, existingItems: PatternCircle[]): number {
        const distanceFromCenter = Math.sqrt(center.x * center.x + center.y * center.y);
        let maxSize = distanceFromCenter; // avoid center of the canvas

        for (const item of existingItems) {
            maxSize = Math.min(maxSize, PatternCircle.computeDistanceToEdge(center, item));
        }

        return 2 * maxSize;
    }

    private static computeDistanceToEdge(center: IPoint, obstacle: PatternCircle): number {
        const toCenterX = center.x - obstacle.center.x;
        const toCenterY = center.y - obstacle.center.y;
        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        return Math.abs(distance - 0.5 * obstacle.diameter);
    }
}

export { PatternCircle }
