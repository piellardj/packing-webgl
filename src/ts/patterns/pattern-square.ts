import { PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";

class PatternSquare extends PatternBase {
    public constructor() {
        super();
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;

        const maxSizeX = Math.abs(toPointX);
        const maxSizeY = Math.abs(toPointY);
        return Math.max(maxSizeX, maxSizeY);
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternSquare, allowOverlapping: boolean): number {
        return 2 * this.computeDistanceToEdge(itemToAvoid, allowOverlapping);
    }

    private get sideLength(): number {
        return this.size;
    }

    private computeDistanceToEdge(obstacle: PatternSquare, allowOverlapping: boolean): number {
        const deltaX = Math.abs(this.center.x - obstacle.center.x);
        const deltaY = Math.abs(this.center.y - obstacle.center.y);

        if (deltaX < 0.5 * obstacle.sideLength) {
            if (deltaY < 0.5 * obstacle.sideLength) {
                if (allowOverlapping) {
                    return Math.min(0.5 * obstacle.sideLength - deltaX, 0.5 * obstacle.sideLength - deltaY);
                }
                return 0;
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
