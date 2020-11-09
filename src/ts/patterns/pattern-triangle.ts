import { EVisibility, PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

function rotatePoint(point: IPoint, cosAngle: number, sinAngle: number): IPoint {
    return {
        x: point.x * cosAngle - point.y * sinAngle,
        y: point.x * sinAngle + point.y * cosAngle,
    };
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

    public constructor() {
        super();

        this.angle = 2 * Math.PI * Math.random();

        const cosAngle = Math.cos(this.angle);
        const sinAngle = Math.sin(this.angle);
        this.P1 = rotatePoint(PatternTriangle.baseP1, cosAngle, sinAngle);
        this.P2 = rotatePoint(PatternTriangle.baseP2, cosAngle, sinAngle);
        this.P3 = rotatePoint(PatternTriangle.baseP3, cosAngle, sinAngle);
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;

        const maxSizeX = Math.abs(toPointX);
        const maxSizeY = Math.abs(toPointY);
        return Math.max(maxSizeX, maxSizeY);
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
