import { PlotterBase } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";

class PatternCircle extends PatternBase {
    public constructor() {
        super();
    }

    protected drawInternal(plotter: PlotterBase): void {
        plotter.drawCircle(this.center, this.radius, this.color);
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;
        return Math.sqrt(toPointX * toPointX + toPointY * toPointY);
    }

    public computeBiggestSizePossibleToAvoidItems(existingItems: PatternCircle[]): number {
        let maxSize = 10000;

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
