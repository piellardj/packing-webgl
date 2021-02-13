import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { EVisibility, ISizeComputationResult, PatternBase } from "./pattern-base";

function rotatePoint(point: IPoint, cosAngle: number, sinAngle: number): IPoint {
    return {
        x: point.x * cosAngle - point.y * sinAngle,
        y: point.x * sinAngle + point.y * cosAngle,
    };
}

/** Computes intersection between a segment and a semiline, both defined with parametric equations.
 * The first segment is defined with "from1 + t1 * delta1" for 0 <= t1 <= 2
 * The semi line is defined with "0 + t2 * delta2" for 0 <= t2
 * @returns if there is an intersection, t2 >= 0
 *          if there is no intersection, returns a negative value
 */
function computeSegmentsIntersection(from1: IPoint, delta1: IPoint, delta2: IPoint): number {
    const denom = delta2.y * delta1.x - delta1.y * delta2.x;
    if (denom !== 0) {
        const invDenom = 1 / denom;

        const t1 = (delta2.x * from1.y - delta2.y * from1.x) * invDenom;
        if (0 <= t1 && t1 <= 1) {
            const t2 = (delta1.x * from1.y - delta1.y * from1.x) * invDenom;
            return t2;
        }
    }
    return -1;
}

const MAX_NUMBER = 100000000;
function minPositive(...args: number[]): number {
    let min = MAX_NUMBER;
    for (const arg of args) {
        if (arg >= 0 && arg < min) {
            min = arg;
        }
    }
    return (min === MAX_NUMBER) ? -1 : min;
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

        let intersection = computeSegmentsIntersection(this.P1, this.P1_TO_P2, pointToAvoidLocal);
        if (intersection < 0) {
            intersection = computeSegmentsIntersection(this.P2, this.P2_TO_P3, pointToAvoidLocal);
            if (intersection < 0) {
                intersection = computeSegmentsIntersection(this.P3, this.P3_TO_P1, pointToAvoidLocal);
            }
        }

        if (intersection > 0) {
            return 1 / intersection;
        }
        return 0;
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternTriangle, allowOverlapping: boolean): ISizeComputationResult {
        const result = {
            size: 0,
            isInside: itemToAvoid.isPointInside(this.center.x, this.center.y),
        };

        if (result.isInside && !allowOverlapping) {
            return result;
        }

        const localOtherP1: IPoint = {
            x: itemToAvoid.center.x + itemToAvoid.P1.x * itemToAvoid.size - this.center.x,
            y: itemToAvoid.center.y + itemToAvoid.P1.y * itemToAvoid.size - this.center.y,
        };

        const localOtherP2: IPoint = {
            x: itemToAvoid.center.x + itemToAvoid.P2.x * itemToAvoid.size - this.center.x,
            y: itemToAvoid.center.y + itemToAvoid.P2.y * itemToAvoid.size - this.center.y,
        };

        const localOtherP3: IPoint = {
            x: itemToAvoid.center.x + itemToAvoid.P3.x * itemToAvoid.size - this.center.x,
            y: itemToAvoid.center.y + itemToAvoid.P3.y * itemToAvoid.size - this.center.y,
        };

        const scaledOtherP1toP2: IPoint = {
            x: itemToAvoid.P1_TO_P2.x * itemToAvoid.size,
            y: itemToAvoid.P1_TO_P2.y * itemToAvoid.size,
        };

        const scaledOtherP2toP3: IPoint = {
            x: itemToAvoid.P2_TO_P3.x * itemToAvoid.size,
            y: itemToAvoid.P2_TO_P3.y * itemToAvoid.size,
        };

        const scaledOtherP3toP1: IPoint = {
            x: itemToAvoid.P3_TO_P1.x * itemToAvoid.size,
            y: itemToAvoid.P3_TO_P1.y * itemToAvoid.size,
        };

        // Check if a vertice of this may intersect a side of the other
        let smallerTforMyVertices: number;
        {
            const T1_1 = computeSegmentsIntersection(localOtherP1, scaledOtherP1toP2, this.P1);
            const T1_2 = computeSegmentsIntersection(localOtherP2, scaledOtherP2toP3, this.P1);
            const T1_3 = computeSegmentsIntersection(localOtherP3, scaledOtherP3toP1, this.P1);

            const T2_1 = computeSegmentsIntersection(localOtherP1, scaledOtherP1toP2, this.P2);
            const T2_2 = computeSegmentsIntersection(localOtherP2, scaledOtherP2toP3, this.P2);
            const T2_3 = computeSegmentsIntersection(localOtherP3, scaledOtherP3toP1, this.P2);

            const T3_1 = computeSegmentsIntersection(localOtherP1, scaledOtherP1toP2, this.P3);
            const T3_2 = computeSegmentsIntersection(localOtherP2, scaledOtherP2toP3, this.P3);
            const T3_3 = computeSegmentsIntersection(localOtherP3, scaledOtherP3toP1, this.P3);

            smallerTforMyVertices = minPositive(T1_1, T1_2, T1_3, T2_1, T2_2, T2_3, T3_1, T3_2, T3_3);
        }

        let smallerTforMySides: number;
        {
            const T1_1 = computeSegmentsIntersection(this.P1, this.P1_TO_P2, localOtherP1);
            const T1_2 = computeSegmentsIntersection(this.P2, this.P2_TO_P3, localOtherP1);
            const T1_3 = computeSegmentsIntersection(this.P3, this.P3_TO_P1, localOtherP1);

            const T2_1 = computeSegmentsIntersection(this.P1, this.P1_TO_P2, localOtherP2);
            const T2_2 = computeSegmentsIntersection(this.P2, this.P2_TO_P3, localOtherP2);
            const T2_3 = computeSegmentsIntersection(this.P3, this.P3_TO_P1, localOtherP2);

            const T3_1 = computeSegmentsIntersection(this.P1, this.P1_TO_P2, localOtherP3);
            const T3_2 = computeSegmentsIntersection(this.P2, this.P2_TO_P3, localOtherP3);
            const T3_3 = computeSegmentsIntersection(this.P3, this.P3_TO_P1, localOtherP3);

            const max = Math.max(T1_1, T1_2, T1_3, T2_1, T2_2, T2_3, T3_1, T3_2, T3_3);
            if (max !== 0) {
                smallerTforMySides = 1 / max;
            } else {
                smallerTforMySides = -1;
            }
        }

        result.size = minPositive(smallerTforMyVertices, smallerTforMySides);
        return result;
    }

    public computeVisibility(domainSize: ISize): EVisibility {
        const halfDomainWidth = 0.5 * domainSize.width;
        const halfDomainHeight = 0.5 * domainSize.height;

        const absX = Math.abs(this.center.x);
        const absY = Math.abs(this.center.y);

        const halfSize = 0.5 * this.size;

        if (this.isPointInside(-halfDomainWidth, -halfDomainHeight) && this.isPointInside(halfDomainWidth, -halfDomainHeight) && this.isPointInside(-halfDomainWidth, halfDomainHeight) && this.isPointInside(halfDomainWidth, halfDomainHeight)) {
            return EVisibility.COVERS_VIEW;
        }
        if (absX - halfSize < halfDomainWidth && absY - halfSize < halfDomainHeight) {
            return EVisibility.VISIBLE;
        }
        return EVisibility.OUT_OF_VIEW;
    }

    private isPointInside(x: number, y: number): boolean {
        x = (x - this.center.x) / this.size;
        y = (y - this.center.y) / this.size;

        const d1 = this.P1_TO_P2.x * (y - this.P2.y) - (x - this.P2.x) * this.P1_TO_P2.y;
        const d2 = this.P2_TO_P3.x * (y - this.P3.y) - (x - this.P3.x) * this.P2_TO_P3.y;
        const d3 = this.P3_TO_P1.x * (y - this.P1.y) - (x - this.P1.x) * this.P3_TO_P1.y;

        return (d1 <= 0 && d2 <= 0 && d3 <= 0) || (d1 > 0 && d2 > 0 && d3 > 0);
    }
}

export { PatternTriangle };
