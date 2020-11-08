import { EVisibility, PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

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
