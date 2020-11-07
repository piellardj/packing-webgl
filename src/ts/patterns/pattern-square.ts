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
        const halfSideLength = 0.5 * obstacle.sideLength;

        if (deltaX < halfSideLength) {
            if (deltaY < halfSideLength) {
                if (allowOverlapping) {
                    return Math.min(halfSideLength - deltaX, halfSideLength - deltaY);
                }
                return 0;
            } else {
                return deltaY - halfSideLength;
            }
        } else {
            if (deltaY < halfSideLength) {
                return deltaX - halfSideLength;
            } else {
                return Math.max(deltaX - halfSideLength, deltaY - halfSideLength);
            }
        }
    }
}

export { PatternSquare }
