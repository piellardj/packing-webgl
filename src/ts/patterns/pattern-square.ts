import { EVisibility, PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

class PatternSquare extends PatternBase {
    public constructor() {
        super();
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;

        const maxSizeX = Math.abs(toPointX);
        const maxSizeY = Math.abs(toPointY);
        return 2 * Math.max(maxSizeX, maxSizeY);
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternSquare, allowOverlapping: boolean): number {
        return 2 * this.computeDistanceToEdge(itemToAvoid, allowOverlapping);
    }

    public computeVisibility(domainSize: ISize): EVisibility {
        const halfDomainWidth = 0.5 * domainSize.width;
        const halfDomainHeight = 0.5 * domainSize.height;

        const absX = Math.abs(this.center.x);
        const absY = Math.abs(this.center.y);

        const halfSize = 0.5 * this.size;

        if (absX + halfDomainWidth < halfSize && absY + halfDomainHeight < halfSize) {
            return EVisibility.COVERS_VIEW;
        }
        if (absX - halfSize < halfDomainWidth && absY - halfSize < halfDomainHeight) {
            return EVisibility.VISIBLE;
        }
        return EVisibility.OUT_OF_VIEW;
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
