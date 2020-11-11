import { EVisibility, ISizeComputationResult, PatternBase } from "./pattern-base";

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

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternSquare, allowOverlapping: boolean): ISizeComputationResult {
        const result = { size: 0, isInside: false };

        const deltaX = Math.abs(this.center.x - itemToAvoid.center.x);
        const deltaY = Math.abs(this.center.y - itemToAvoid.center.y);
        const halfSideLength = 0.5 * itemToAvoid.sideLength;

        if (deltaX < halfSideLength) {
            if (deltaY < halfSideLength) {
                if (allowOverlapping) {
                    result.size = 2 * Math.min(halfSideLength - deltaX, halfSideLength - deltaY);
                    result.isInside = true;
                }
            } else {
                result.size = 2 * (deltaY - halfSideLength);
            }
        } else {
            if (deltaY < halfSideLength) {
                result.size = 2 * (deltaX - halfSideLength);
            } else {
                result.size = 2 * Math.max(deltaX - halfSideLength, deltaY - halfSideLength);
            }
        }

        return result;
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
}

export { PatternSquare }
