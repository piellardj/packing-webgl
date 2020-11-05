import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { PlotterBase } from "../plotter/plotter-base";

import { Grid } from "../space-grid/grid";

import * as Helper from "../utils/helper";
import { NumberRange } from "../utils/number-range";

const MAX_RESET_TRIES = 100;

abstract class PatternBase {
    public center: IPoint;
    public size: number;
    public color: string;
    public needInitialization: boolean;

    protected constructor() {
        this.needInitialization = true;

        this.center = { x: 0, y: 0 };
        this.size = 0;
        this.color = "green";
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

            // first, test only the closest existing items
            const cellId = grid.getCellId(this.center);
            const maxDistanceDetectable = grid.getDistanceToClosestBorder(this.center);
            const existingItems = grid.getItemsFromCell(cellId.x, cellId.y);

            let rawMaxSize = this.computeBiggestSizePossible(existingItems);
            if (rawMaxSize >= maxDistanceDetectable) {
                // the closest items wer emaybe not enough, test items less close
                const minPoint: IPoint = { x: this.center.x - 0.5 * rawMaxSize, y: this.center.y - 0.5 * rawMaxSize };
                const maxPoint: IPoint = { x: this.center.x + 0.5 * rawMaxSize, y: this.center.y + 0.5 * rawMaxSize };
                const minCellId = grid.getCellId(minPoint);
                const maxCellId = grid.getCellId(maxPoint);

                const additionalItemsToTest = grid.getItemsFromCellsGroup(minCellId.x, minCellId.y, maxCellId.x, maxCellId.y);
                rawMaxSize = Math.min(rawMaxSize, this.computeBiggestSizePossible(additionalItemsToTest));
            }

            const maxSize = sizeFactor * rawMaxSize;
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

    public abstract computeBiggestSizePossible(itemsToAvoid: PatternBase[]): number;

    protected abstract drawInternal(plotter: PlotterBase): void;

    private randomizePosition(domainSize: ISize): void {
        this.center.x = Math.round(domainSize.width * (Math.random() - 0.5));
        this.center.y = Math.round(domainSize.height * (Math.random() - 0.5));
    }
}

export { PatternBase }
