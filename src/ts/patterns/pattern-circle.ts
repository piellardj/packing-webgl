import { PlotterBase } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

class PatternCircle extends PatternBase {
    public constructor() {
        super();
    }

    protected drawInternal(plotter: PlotterBase): void {
        plotter.drawCircle(this.center, this.radius, this.color);
    }

    public computeBiggestSizePossible(existingItems: PatternCircle[]): number {
        const distanceFromCanvasCenter = Math.sqrt(this.center.x * this.center.x + this.center.y * this.center.y);
        let maxSize = distanceFromCanvasCenter; // avoid center of the canvas

        for (const item of existingItems) {
            if (!item.needInitialization) {
                maxSize = Math.min(maxSize, this.computeDistanceToEdge(item));
            }
        }

        return 2 * maxSize;
    }

    private get radius(): number {
        return 0.5 * this.size;
    }

    private computeDistanceToEdge(obstacle: PatternCircle): number {
        const toCenterX = this.center.x - obstacle.center.x;
        const toCenterY = this.center.y - obstacle.center.y;
        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        return Math.abs(distance - obstacle.radius);
    }
}

export { PatternCircle }
