import { Color } from "../utils/color";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { Grid } from "../space-grid/grid";

import { NumberRange } from "../utils/number-range";
import { Parameters } from "../parameters";

const CANVAS_CENTER: IPoint = { x: 0, y: 0 };

const MAX_TEST_ID = 999999999999; // lower (for extra safety) than Number.MAX_SAFE_INTEGER (which is not supported by IE11)
let globalLastTestId = 1;

function generateTestId(): number {
    globalLastTestId = (globalLastTestId + 1) % MAX_TEST_ID;
    return globalLastTestId;
}

interface IPatternResetResult {
    success: boolean;
    nbTries: number;
}

interface ISizeComputationResult {
    size: number;
    isInside: boolean;
}

enum EVisibility {
    VISIBLE = 0,
    OUT_OF_VIEW = 1,
    COVERS_VIEW = 2,
}

abstract class PatternBase {
    public static baseNestingLevel: number = 0;
    public static additionalNestingLevelForColor: number = 0;
    public static highContrastColor: boolean = false;


    /* When an item is too big, it can lead to visual glitches due to float precision issue on GPU.
     *  To avoid this, remove items that are too big. */
    public static readonly MAX_SIZE: number = 1000000;
    private static readonly MAX_SIZE_LOWER: number = 0.75 * PatternBase.MAX_SIZE;
    private static readonly MAX_SIZE_GAP: number = PatternBase.MAX_SIZE - PatternBase.MAX_SIZE_LOWER;

    public static get maxBlendingTime(): number {
        if (Parameters.blending) {
            return 500 / (1 + Parameters.zoomSpeed);
        }
        return 0;
    }

    public center: IPoint;
    public size: number;
    public nestingLevel: number;
    public readonly rawColor: Color;

    private lastTestId: number;
    private initializationTime: number;

    protected constructor() {
        this.center = { x: 0, y: 0 };
        this.size = 0;
        this.nestingLevel = PatternBase.baseNestingLevel + 1;
        this.rawColor = Color.random();
        this.lastTestId = 0;
    }

    public get color(): Color {
        if (PatternBase.highContrastColor) {
            return ((this.nestingLevel + PatternBase.additionalNestingLevelForColor) % 2 === 0) ? Color.BLACK : Color.WHITE;
        }
        return this.rawColor;
    }

    public zoomIn(zoomCenter: IPoint, zoomFactor: number): void {
        this.center.x = (this.center.x - zoomCenter.x) * zoomFactor + zoomCenter.x;
        this.center.y = (this.center.y - zoomCenter.y) * zoomFactor + zoomCenter.y;
        this.size *= zoomFactor;
    }

    /** @returns the number of tries (regardless of the success of the reset) */
    public reset(domainSize: ISize, grid: Grid, sizeFactor: number, acceptedSizes: NumberRange, allowOverlapping: boolean, maxTries: number): IPatternResetResult {
        const result: IPatternResetResult = {
            nbTries: 0,
            success: false,
        };

        while (result.nbTries < maxTries && !result.success) {
            this.randomizePosition(domainSize);
            this.nestingLevel = PatternBase.baseNestingLevel + 1;

            const maxSize = sizeFactor * this.computeBiggestSizePossible(grid, allowOverlapping);
            if (acceptedSizes.isInRange(maxSize)) {
                this.size = 2 * Math.floor(0.5 * maxSize); // need to be even to avoid aliasing
                this.initializationTime = performance.now();
                result.success = true;
            }

            result.nbTries++;
        }

        return result;
    }

    public computeOpacity(time: number, blendTime: number): number {
        if (this.size > PatternBase.MAX_SIZE_LOWER) {
            const r = (this.size - PatternBase.MAX_SIZE_LOWER) / PatternBase.MAX_SIZE_GAP;
            return ( r > 1) ? 0 : 1 - r;
        }

        const lifetime = time - this.initializationTime;
        if (lifetime > blendTime) {
            return 1;
        }
        return lifetime / blendTime;
    }

    protected abstract computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number;

    protected abstract computeBiggestSizePossibleToAvoidItem(itemsToAvoid: PatternBase, allowOverlapping: boolean): ISizeComputationResult;

    public abstract computeVisibility(domainSize: ISize): EVisibility;

    private computeBiggestSizePossible(grid: Grid, allowOverlapping: boolean): number {
        const currentTestId = generateTestId();

        const biggestSizeToAvoidCenter = this.computeBiggestSizePossibleToAvoidPoint(CANVAS_CENTER);
        let rawMaxSize = biggestSizeToAvoidCenter;

        // first, test only existing items that are in the exact same grid cell as us
        const maxDistanceDetectableByExactCell = grid.getDistanceToClosestBorder(this.center);

        const exactCellId = grid.getCellId(this.center);
        const existingItemsFromExactCell = grid.getItemsFromCell(exactCellId.x, exactCellId.y);
        const biggestSizeToAvoidClosestItems = this.computeBiggestSizePossibleToAvoidItems(existingItemsFromExactCell, allowOverlapping, currentTestId);
        rawMaxSize = Math.min(rawMaxSize, biggestSizeToAvoidClosestItems);

        // the closest items were maybe not enough, test items that are a bit further
        if (rawMaxSize >= maxDistanceDetectableByExactCell) {
            const topLeftPoint: IPoint = { x: this.center.x - 0.5 * rawMaxSize, y: this.center.y - 0.5 * rawMaxSize };
            const bottomRightPoint: IPoint = { x: this.center.x + 0.5 * rawMaxSize, y: this.center.y + 0.5 * rawMaxSize };
            const minCellId = grid.getCellId(topLeftPoint);
            const maxCellId = grid.getCellId(bottomRightPoint);

            const additionalItemsToTest = grid.getItemsFromCellsGroup(minCellId.x, minCellId.y, maxCellId.x, maxCellId.y);
            const biggestSizeToAvoidFurtherItems = this.computeBiggestSizePossibleToAvoidItems(additionalItemsToTest, allowOverlapping, currentTestId);
            rawMaxSize = Math.min(rawMaxSize, biggestSizeToAvoidFurtherItems);
        }

        return rawMaxSize;
    }

    private computeBiggestSizePossibleToAvoidItems(itemsToAvoid: PatternBase[], allowOverlapping: boolean, currentTestId: number): number {
        let maxSize = 100000;

        for (const item of itemsToAvoid) {
            if (item !== this) {
                const testedAlready = (item.lastTestId === currentTestId);
                if (!testedAlready) {
                    const result = this.computeBiggestSizePossibleToAvoidItem(item, allowOverlapping);
                    if (result.size < maxSize) {
                        maxSize = result.size;

                        if (result.isInside) {
                            this.nestingLevel = item.nestingLevel + 1;
                        }
                    }
                    item.lastTestId = currentTestId;
                }
            }
        }

        return maxSize;
    }

    private randomizePosition(domainSize: ISize): void {
        this.center.x = Math.round(domainSize.width * (Math.random() - 0.5));
        this.center.y = Math.round(domainSize.height * (Math.random() - 0.5));
    }
}

export { PatternBase, EVisibility, ISizeComputationResult }
