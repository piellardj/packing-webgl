import { EVisibility, PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

function rotatePoint(point: IPoint, cosAngle: number, sinAngle: number): IPoint {
    return {
        x: point.x * cosAngle - point.y * sinAngle,
        y: point.x * sinAngle + point.y * cosAngle,
    };
}

/** Input segments are defined by points from the equation "from + t * delta", for 0<t<1
 * @returns if there is an intersection, the ratio dist(from2,to2) / dist(from2, intesection)
 *           if there is no intersection, returns a negative value
 */
function computeSegmentsIntersection(from1: IPoint, delta1: IPoint, from2: IPoint, delta2: IPoint): number {
    const denom = delta2.y * delta1.x - delta1.y * delta2.x;
    if (denom !== 0) {
        const invDenom = 1 / denom;
        const deltaFromY = from2.y - from1.y;
        const deltaFromX = from2.x - from1.x;

        const t1 = (delta2.y * deltaFromX - delta2.x * deltaFromY) * invDenom;
        if (0 <= t1 && t1 <= 1) {
            const t2 = (delta1.y * deltaFromX - delta1.x * deltaFromY) * invDenom;
            return t2;
        }
    }
    return -1;
}

class PatternTriangle extends PatternBase {
    public readonly angle: number;

    public static readonly baseP1: IPoint = { x: 0, y: -0.5 };
    public static readonly baseP2: IPoint = { x: 0.5 * Math.cos(Math.PI * 7 / 6), y: -0.5 * Math.sin(Math.PI * 7 / 6) };
    public static readonly baseP3: IPoint = { x: -0.5 * Math.cos(Math.PI * 7 / 6), y: -0.5 * Math.sin(Math.PI * 7 / 6) };

    // rotated, with a size=1
    public readonly P1: IPoint;
    public readonly P2: IPoint;
    public readonly P3: IPoint;

    // with a size=1
    public readonly P1_TO_P2: IPoint;
    public readonly P2_TO_P3: IPoint;
    public readonly P3_TO_P1: IPoint;

    public constructor() {
        super();

        this.angle = 2 * Math.PI * Math.random();

        const cosAngle = Math.cos(this.angle);
        const sinAngle = Math.sin(this.angle);
        this.P1 = rotatePoint(PatternTriangle.baseP1, cosAngle, sinAngle);
        this.P2 = rotatePoint(PatternTriangle.baseP2, cosAngle, sinAngle);
        this.P3 = rotatePoint(PatternTriangle.baseP3, cosAngle, sinAngle);

        this.P1_TO_P2 = { x: this.P2.x - this.P1.x, y: this.P2.y - this.P1.y };
        this.P2_TO_P3 = { x: this.P3.x - this.P2.x, y: this.P3.y - this.P2.y };
        this.P3_TO_P1 = { x: this.P1.x - this.P3.x, y: this.P1.y - this.P3.y };
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        if (pointToAvoid.x === this.center.x && pointToAvoid.y === this.center.y) {
            return 0;
        }

        const pointToAvoidLocal = { x: pointToAvoid.x - this.center.x, y: pointToAvoid.y - this.center.y };

        let intersection = computeSegmentsIntersection(this.P1, this.P1_TO_P2, { x: 0, y: 0 }, pointToAvoidLocal);
        if (intersection < 0) {
            intersection = computeSegmentsIntersection(this.P2, this.P2_TO_P3, { x: 0, y: 0 }, pointToAvoidLocal);
            if (intersection < 0) {
                intersection = computeSegmentsIntersection(this.P3, this.P3_TO_P1, { x: 0, y: 0 }, pointToAvoidLocal);
            }
        }

        if (intersection > 0) {
            return 1 / intersection;
        }
        return 0;
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternTriangle, allowOverlapping: boolean): number {
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

    private computeDistanceToEdge(obstacle: PatternTriangle, allowOverlapping: boolean): number {
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

export { PatternTriangle }
