import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { EVisibility, ISizeComputationResult, PatternBase } from "./pattern-base";

class PatternCircle extends PatternBase {
    public constructor() {
        super();
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;
        return 2 * Math.sqrt(toPointX * toPointX + toPointY * toPointY);
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternCircle, allowOverlapping: boolean): ISizeComputationResult {
        const result = { size: 0, isInside: false };

        const toCenterX = this.center.x - itemToAvoid.center.x;
        const toCenterY = this.center.y - itemToAvoid.center.y;

        const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);

        if (distance <= itemToAvoid.radius) {
            result.isInside = true;
            if (allowOverlapping) {
                result.size = 2 * (itemToAvoid.radius - distance);
            }
        } else {
            result.size = 2 * (distance - itemToAvoid.radius);
        }

        return result;
    }

    public computeVisibility(domainSize: ISize): EVisibility {
        const halfDomainWidth = 0.5 * domainSize.width;
        const halfDomainHeight = 0.5 * domainSize.height;

        const absX = Math.abs(this.center.x);
        const absY = Math.abs(this.center.y);

        const dX = absX + halfDomainWidth;
        const dY = absY + halfDomainHeight;

        const radius = this.radius;
        if (radius * radius > dX * dX + dY * dY) {
            return EVisibility.COVERS_VIEW;
        }
        if (absX - radius < halfDomainWidth && absY - radius < halfDomainHeight) {
            return EVisibility.VISIBLE;
        }
        return EVisibility.OUT_OF_VIEW;
    }

    public get radius(): number {
        return 0.5 * this.size;
    }
}

export { PatternCircle };
