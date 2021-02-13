import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { EVisibility, ISizeComputationResult, PatternBase } from "./pattern-base";

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

    protected computeBiggestSizePossibleToAvoidItem(itemToAvoid: PatternRectangle, allowOverlapping: boolean): ISizeComputationResult {
        const result = { size: 0, isInside: false };

        const deltaX = Math.abs(this.center.x - itemToAvoid.center.x);
        const deltaY = Math.abs(this.center.y - itemToAvoid.center.y);

        const halfObstacleWidth = 0.5 * itemToAvoid.width;
        const halfObstacleHeight = 0.5 * itemToAvoid.height;

        if (deltaX < halfObstacleWidth) {
            if (deltaY < halfObstacleHeight) {
                result.isInside = true;
                if (allowOverlapping) {
                    result.size = 2 * Math.min((halfObstacleWidth - deltaX) / this.baseWidth, (halfObstacleHeight - deltaY) / this.baseHeight);
                }
            } else {
                result.size = 2 * (deltaY - halfObstacleHeight) / this.baseHeight;
            }
        } else {
            if (deltaY < halfObstacleHeight) {
                result.size = 2 * (deltaX - halfObstacleWidth) / this.baseWidth;
            } else {
                result.size = 2 * Math.max((deltaX - halfObstacleWidth) / this.baseWidth, (deltaY - halfObstacleHeight) / this.baseHeight);
            }
        }

        return result;
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
}

export { PatternRectangle };
