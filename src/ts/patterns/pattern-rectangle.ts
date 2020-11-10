import { EVisibility, PatternBase } from "./pattern-base";

import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

const ASPECT_RATIO_VARIATION = 0.5; // must be in [0,1]

class PatternRectangle extends PatternBase {
    private readonly baseWidth: number; // in [0,1]
    private readonly baseHeight: number; // in [0,1]
    public readonly aspectRatio: number;

    public constructor() {
        super();

        this.aspectRatio = 1 + ASPECT_RATIO_VARIATION * (2 * Math.random() - 1);
        if (this.aspectRatio >= 1) {
            this.baseWidth = 1;
            this.baseHeight = 1 / this.aspectRatio;
        } else {
            this.baseWidth = this.aspectRatio;
            this.baseHeight = 1;
        }
    }

    protected computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number {
        const toPointX = pointToAvoid.x - this.center.x;
        const toPointY = pointToAvoid.y - this.center.y;

        const maxSizeX = Math.abs(toPointX) / this.baseWidth;
        const maxSizeY = Math.abs(toPointY) / this.baseHeight;
        return 2 * Math.max(maxSizeX, maxSizeY);
    }

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternRectangle, allowOverlapping: boolean): number {
        return 2 * this.computeDistanceToEdge(itemToAvoid, allowOverlapping);
    }

    public computeVisibility(domainSize: ISize): EVisibility {
        const halfDomainWidth = 0.5 * domainSize.width;
        const halfDomainHeight = 0.5 * domainSize.height;

        const absX = Math.abs(this.center.x);
        const absY = Math.abs(this.center.y);

        const halfWidth = 0.5 * this.size * this.baseWidth;
        const halfHeight = 0.5 * this.size * this.baseHeight;

        if (absX + halfDomainWidth < halfWidth && absY + halfDomainHeight < halfHeight) {
            return EVisibility.COVERS_VIEW;
        }
        if (absX - halfWidth < halfDomainWidth && absY - halfHeight < halfDomainHeight) {
            return EVisibility.VISIBLE;
        }
        return EVisibility.OUT_OF_VIEW;
    }

    public get width(): number {
        return this.size * this.baseWidth;
    }

    public get height(): number {
        return this.size * this.baseHeight;
    }

    private computeDistanceToEdge(obstacle: PatternRectangle, allowOverlapping: boolean): number {
        const deltaX = Math.abs(this.center.x - obstacle.center.x);
        const deltaY = Math.abs(this.center.y - obstacle.center.y);

        const halfObstacleWidth = 0.5 * obstacle.width;
        const halfObstacleHeight = 0.5 * obstacle.height;

        if (deltaX < halfObstacleWidth) {
            if (deltaY < halfObstacleHeight) {
                if (allowOverlapping) {
                    return Math.min((halfObstacleWidth - deltaX) / this.baseWidth, (halfObstacleHeight - deltaY) / this.baseHeight);
                }
                return 0;
            } else {
                return (deltaY - halfObstacleHeight) / this.baseHeight;
            }
        } else {
            if (deltaY < halfObstacleHeight) {
                return (deltaX - halfObstacleWidth) / this.baseWidth;
            } else {
                return Math.max((deltaX - halfObstacleWidth) / this.baseWidth, (deltaY - halfObstacleHeight) / this.baseHeight);
            }
        }
    }
}

export { PatternRectangle }
