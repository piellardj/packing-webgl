import { Color } from "../utils/color";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { Grid } from "../space-grid/grid";

import { NumberRange } from "../utils/number-range";

const CANVAS_CENTER: IPoint = { x: 0, y: 0 };

const MAX_TEST_ID = 999999999999; // lower (for extra safety) than Number.MAX_SAFE_INTEGER (which is not supported by IE11)
let globalLastTestId = 1;

function generateTestId(): number {
    globalLastTestId = (globalLastTestId + 1) % MAX_TEST_ID;
    return globalLastTestId;
}

abstract class PatternBase {
    public center: IPoint;
    public size: number;
    public readonly color: Color;
    public needInitialization: boolean;
    private lastTestId: number;

    protected constructor() {
        this.needInitialization = true;

        this.center = { x: 0, y: 0 };
        this.size = 0;
        this.color = Color.random();
        this.lastTestId = 0;
    }

    public zoomIn(zoomFactor: number): void {
        this.center.x *= zoomFactor;
        this.center.y *= zoomFactor;
        this.size *= zoomFactor;
    }

    /** @returns the number of tries (regardless of the success of the reset) */
    public reset(domainSize: ISize, grid: Grid, sizeFactor: number, acceptedSizes: NumberRange, maxTries: number): number {
        let iTry = 0;
        while (iTry < maxTries) {
            this.randomizePosition(domainSize);

            const maxSize = sizeFactor * this.computeBiggestSizePossible(grid);
            if (acceptedSizes.isInRange(maxSize)) {
                this.size = 2 * Math.floor(0.5 * maxSize); // need to be even to avoid aliasing
                this.needInitialization = false;
                break;
            }

            iTry++;
        }

        return iTry;
    }

    public isInDomain(domainSize: ISize): boolean {
        const absX = Math.abs(this.center.x);
        const absY = Math.abs(this.center.y);

        return absX - 0.5 * this.size < 0.5 * domainSize.width &&
            absY - 0.5 * this.size < 0.5 * domainSize.height;
    }

    protected abstract computeBiggestSizePossibleToAvoidPoint(pointToAvoid: IPoint): number;

    protected abstract computeBiggestSizePossibleToAvoidItem(itemsToAvoid: PatternBase): number;

    private computeBiggestSizePossible(grid: Grid): number {
        const currentTestId = generateTestId();

        const biggestSizeToAvoidCenter = this.computeBiggestSizePossibleToAvoidPoint(CANVAS_CENTER);
        let rawMaxSize = biggestSizeToAvoidCenter;

        // first, test only existing items that are in the exact same grid cell as us
        const maxDistanceDetectableByExactCell = grid.getDistanceToClosestBorder(this.center);

        const exactCellId = grid.getCellId(this.center);
        const existingItemsFromExactCell = grid.getItemsFromCell(exactCellId.x, exactCellId.y);
        const biggestSizeToAvoidClosestItems = this.computeBiggestSizePossibleToAvoidItems(existingItemsFromExactCell, currentTestId);
        rawMaxSize = Math.min(rawMaxSize, biggestSizeToAvoidClosestItems);

        // the closest items were maybe not enough, test items that are a bit further
        if (rawMaxSize >= maxDistanceDetectableByExactCell) {
            const topLeftPoint: IPoint = { x: this.center.x - 0.5 * rawMaxSize, y: this.center.y - 0.5 * rawMaxSize };
            const bottomRightPoint: IPoint = { x: this.center.x + 0.5 * rawMaxSize, y: this.center.y + 0.5 * rawMaxSize };
            const minCellId = grid.getCellId(topLeftPoint);
            const maxCellId = grid.getCellId(bottomRightPoint);

            const additionalItemsToTest = grid.getItemsFromCellsGroup(minCellId.x, minCellId.y, maxCellId.x, maxCellId.y);
            const biggestSizeToAvoidFurtherItems = this.computeBiggestSizePossibleToAvoidItems(additionalItemsToTest, currentTestId);
            rawMaxSize = Math.min(rawMaxSize, biggestSizeToAvoidFurtherItems);
        }

        return rawMaxSize;
    }

    private computeBiggestSizePossibleToAvoidItems(itemsToAvoid: PatternBase[], currentTestId: number): number {
        let maxSize = 100000;

        for (const item of itemsToAvoid) {
            if (!item.needInitialization) {
                const testedAlready = (item.lastTestId === currentTestId);
                if (!testedAlready) {
                    maxSize = Math.min(maxSize, this.computeBiggestSizePossibleToAvoidItem(item));
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

export { PatternBase }
