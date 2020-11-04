import { PlotterBase } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

class PatternSquare extends PatternBase {
    public constructor() {
        super();
    }

    protected drawInternal(plotter: PlotterBase): void {
        plotter.drawSquare(this.center, this.sideLength, this.color);
    }

    public computeBiggestSizePossible(itemsToAvoid: PatternSquare[]): number {
        const maxSizeX = Math.abs(this.center.x);
        const maxSizeY = Math.abs(this.center.y);
        let maxSize = Math.max(maxSizeX, maxSizeY); // avoid center of the canvas

        for (const item of itemsToAvoid) {
            maxSize = Math.min(maxSize, this.computeDistanceToEdge(item));
        }

        return 2 * maxSize;
    }

    private get sideLength(): number {
        return this.size;
    }

    private computeDistanceToEdge(obstacle: PatternSquare): number {
        const deltaX = Math.abs(this.center.x - obstacle.center.x);
        const deltaY = Math.abs(this.center.y - obstacle.center.y);

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
