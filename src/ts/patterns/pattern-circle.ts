import { PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";

class PatternCircle extends PatternBase {
    public constructor() {
        super();
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;
        return Math.sqrt(toPointX * toPointX + toPointY * toPointY);
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternCircle, allowOverlapping: boolean): number {
        return 2 * this.distanceToEdge(itemToAvoid, allowOverlapping);
    }

    private distanceToEdge(itemToAvoid: PatternCircle, allowOverlapping: boolean): number {
        const toCenterX = this.center.x - itemToAvoid.center.x;
        const toCenterY = this.center.y - itemToAvoid.center.y;

        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);

        if (distance <= itemToAvoid.radius) {
            if (allowOverlapping) {
                return itemToAvoid.radius - distance;
            }
            return 0;
        }
        return distance - itemToAvoid.radius;
    }

    public get radius(): number {
        return 0.5 * this.size;
    }
}

export { PatternCircle }
