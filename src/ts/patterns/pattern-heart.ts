import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { EVisibility, ISizeComputationResult, PatternBase } from "./pattern-base";

const INVERT_SQRT_2 = 1 / Math.sqrt(2);

function clamp(x: number, min: number, max: number): number {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    }
    return x;
}

class PatternHeart extends PatternBase {
    public static readonly a: number = 0.5 * 0.82842712474; // 2 / (1 + sqrt(2))
    public static readonly b: number = 0.5 * 1.17157287525; // sqrt(2) * a
    public static readonly c: number = 0.5 * 0.58578643762; // 2 + (2 + sqrt(2))

    public constructor() {
        super();
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = Math.abs(pointToAvoid.x - this.center.x); // symmetry
        const toPointY = pointToAvoid.y - this.center.y;

        const distance = Math.sqrt(toPointX * toPointX + toPointY * toPointY);
        const EPSILON = 0.00000001; // to avoid dividing by zero

        // polar coordinates
        let r: number;
        if (toPointY >= 0) {
            r = distance * PatternHeart.a / (toPointX + toPointY + EPSILON);
        } else {
            r = PatternHeart.a * (toPointX - toPointY) / (distance + EPSILON);
        }
        return distance / r;
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternHeart, allowOverlapping: boolean): ISizeComputationResult {
        const result = {
            size: 0,
            isInside: itemToAvoid.isPointInside(this.center),
        };
        if (result.isInside && !allowOverlapping) {
            return result;
        }

        const deltaX = Math.abs(this.center.x - itemToAvoid.center.x); // symmetry
        const deltaY = this.center.y - itemToAvoid.center.y;
        const rotatedDeltaX = INVERT_SQRT_2 * (deltaX - deltaY);
        const rotatedDeltaY = INVERT_SQRT_2 * (deltaY + deltaX);

        const otherHalfB = 0.5 * itemToAvoid.size * PatternHeart.b;
        if (rotatedDeltaX >= -otherHalfB && rotatedDeltaX <= otherHalfB) {
            if (rotatedDeltaY >= otherHalfB) {
                // console.log("zone A");
                result.size = (rotatedDeltaY - otherHalfB) / PatternHeart.b;
            } else if (rotatedDeltaY >= 0) {
                if (Math.abs(rotatedDeltaX) <= rotatedDeltaY) {
                    // console.log("zone B");
                    result.size = 2 * (otherHalfB - rotatedDeltaY) / PatternHeart.b;
                }
            } else if (rotatedDeltaY <= 0) {
                if (rotatedDeltaX <= otherHalfB) {
                    const otherTopPoint: IPoint = {
                        x: itemToAvoid.center.x,
                        y: itemToAvoid.center.y - itemToAvoid.size * PatternHeart.a,
                    };
                    // console.log("zone E");
                    result.size = this.computeBiggestSizePossibleToAvoidPoint(otherTopPoint);
                }
            }
        } else if (rotatedDeltaX <= -otherHalfB) {
            const otherBottomPoint: IPoint = {
                x: itemToAvoid.center.x,
                y: itemToAvoid.center.y + itemToAvoid.size * PatternHeart.a,
            };
            // console.log("zone C");
            result.size = this.computeBiggestSizePossibleToAvoidPoint(otherBottomPoint);
        }

        if (result.size > 0) { // we found the exact perfect size
            return result;
        }

        // In these areas, I didn't find any easy way to compute the exact max size.
        // I approximate it by sampling the border of the item to avoid
        // I make several passes with increasing precision

        let angleSpan = Math.PI;
        let angleMiddle = Math.PI / 4;
        const otherHalfA = 0.5 * itemToAvoid.size * PatternHeart.a;
        const otherC = itemToAvoid.size * PatternHeart.c;

        const side = (this.center.x >= itemToAvoid.center.x) ? 1 : -1;

        result.size = 900000000000; // absurd initial value
        const testSamples = (nbPoints: number): void => {
            const startAngle = clamp(angleMiddle - 0.5 * angleSpan, -Math.PI / 4, 3 / 4 * Math.PI);
            const endAngle = clamp(angleMiddle + 0.5 * angleSpan, -Math.PI / 4, 3 / 4 * Math.PI);

            for (let i = 0; i <= nbPoints; i++) {
                const angle = startAngle + (endAngle - startAngle) * (i / nbPoints);
                const pointToAvoid: IPoint = {
                    x: itemToAvoid.center.x + side * (otherHalfA + otherC * Math.cos(angle)),
                    y: itemToAvoid.center.y - (otherHalfA + otherC * Math.sin(angle)),
                };

                const maxSizeToAvoidThisPoint = this.computeBiggestSizePossibleToAvoidPoint(pointToAvoid);
                if (result.size > maxSizeToAvoidThisPoint) {
                    result.size = maxSizeToAvoidThisPoint;
                    angleMiddle = angle;
                }
            }

            angleSpan /= 2;
        }

        for (let i = 0; i < 12; i++) {
            testSamples(5);
        }
        return result;
    }

    public computeVisibility(domainSize: ISize): EVisibility {
        const halfDomainWidth = 0.5 * domainSize.width;
        const halfDomainHeight = 0.5 * domainSize.height;

        const topLeftInside = this.isPointInside({ x: -halfDomainWidth, y: -halfDomainHeight });
        const topRightInside = this.isPointInside({ x: +halfDomainWidth, y: -halfDomainHeight });
        const bottomLeftInside = this.isPointInside({ x: +halfDomainWidth, y: +halfDomainHeight });
        const bottomRightInside = this.isPointInside({ x: -halfDomainWidth, y: +halfDomainHeight });
        if (topLeftInside && topRightInside && bottomLeftInside && bottomRightInside &&
            this.isPointInside({ x: this.center.x, y: -halfDomainHeight })) {
            return EVisibility.COVERS_VIEW;
        }

        if (topLeftInside || topRightInside || bottomLeftInside || bottomRightInside) {
            return EVisibility.VISIBLE;
        }
        if (Math.abs(this.center.x) - 0.5 * this.size < halfDomainWidth && Math.abs(this.center.y) - 0.5 * this.size < halfDomainHeight) {
            return EVisibility.VISIBLE;
        }

        return EVisibility.OUT_OF_VIEW;
    }

    private isPointInside(point: IPoint): boolean {
        return this.computeBiggestSizePossibleToAvoidPoint(point) <= this.size;
    }
}

export { PatternHeart };
