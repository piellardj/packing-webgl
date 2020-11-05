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

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternCircle): number {
        const toCenterX = this.center.x - itemToAvoid.center.x;
        const toCenterY = this.center.y - itemToAvoid.center.y;
        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        const distanceToEdge = Math.abs(distance - itemToAvoid.radius);
        return 2 * distanceToEdge;
    }

    private get radius(): number {
        return 0.5 * this.size;
    }
}

export { PatternCircle }
