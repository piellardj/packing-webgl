import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { PlotterBase } from "../plotter/plotter-base";

import { Grid } from "../space-grid/grid";

import * as Helper from "../utils/helper";
import { NumberRange } from "../utils/number-range";

const MAX_RESET_TRIES = 100;
const CANVAS_CENTER: IPoint = { x: 0, y: 0 };

abstract class PatternBase {
    public center: IPoint;
    public size: number;
    public color: string;
    public needInitialization: boolean;
    private lastTestId: number;

    protected constructor() {
        this.needInitialization = true;

        this.center = { x: 0, y: 0 };
        this.size = 0;
        this.color = "green";
        this.lastTestId = 0;
    }

    public zoomIn(zoomFactor: number): void {
        this.center.x *= zoomFactor;
        this.center.y *= zoomFactor;
        this.size *= zoomFactor;
    }

    public draw(plotter: PlotterBase): void {
        if (!this.needInitialization) {
            this.drawInternal(plotter);
        }
    }

    public reset(domainSize: ISize, grid: Grid, spacing: number, acceptedSizes: NumberRange): number {
        this.color = Helper.randomHexColor();

        const sizeFactor = 1 - spacing;

        let iTry = 0;
        while (iTry < MAX_RESET_TRIES) {
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

    protected abstract drawInternal(plotter: PlotterBase): void;

    private computeBiggestSizePossible(grid: Grid): number {
        const currentTestId = PatternBase.generateTestId();

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

    private static generateTestId(): number {
        return 1 + Math.round(Math.random() * 100000);
    }
}

export { PatternBase }
