import { PatternBase } from "../patterns/pattern-base";
import { PlotterBase } from "../plotter/plotter-base";
import { Color } from "../color/color";
import { ILine } from "../utils/i-line";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import * as Statistics from "..//statistics/statistics";

type GridCell = PatternBase[];

const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 500;

class Grid {
    private readonly gridSize: ISize;
    private readonly gridCells: GridCell[];
    private readonly topLeftCorner: IPoint;
    private _cellSize: number;

    private registeredItemsCount: number; // including duplicates

    constructor() {
        this.gridSize = { width: 0, height: 0 };
        this.gridCells = [];
        this.topLeftCorner = { x: 0, y: 0 };

        this.reset({ width: 1, height: 1 }, 100, []);
    }

    /** @returns true if the grid needs to be redrawn */
    public reset(domainSize: ISize, cellSize: number, items: PatternBase[]): boolean {
        this.registeredItemsCount = 0;
        const gridHasChanged = this.resetDomain(domainSize, cellSize);

        for (const item of items) {
            this.registerItem(item);
        }

        return gridHasChanged;
    }

    public registerItem(item: PatternBase): void {
        const topLeft: IPoint = {
            x: item.center.x - 0.5 * item.size,
            y: item.center.y - 0.5 * item.size,
        };
        const bottomRight: IPoint = {
            x: item.center.x + 0.5 * item.size,
            y: item.center.y + 0.5 * item.size,
        };

        const minCellId = this.getCellId(topLeft);
        const maxCellId = this.getCellId(bottomRight);

        for (let iCellY = minCellId.y; iCellY <= maxCellId.y; iCellY++) {
            for (let iCellX = minCellId.x; iCellX <= maxCellId.x; iCellX++) {
                const cellId = this.computeCellId(iCellX, iCellY);
                this.gridCells[cellId].push(item);
                this.registeredItemsCount++;
            }
        }
    }

    public draw(plotter: PlotterBase): void {
        const lines: ILine[] = [];

        const minX = this.topLeftCorner.x;
        const maxX = minX + this.gridSize.width * this._cellSize;

        const minY = this.topLeftCorner.y;
        const maxY = minY + this.gridSize.height * this._cellSize;

        for (let iX = 0; iX < this.gridSize.width; iX++) {
            const x = minX + iX * this._cellSize;
            const line: ILine = {
                from: { x, y: minY },
                to: { x, y: maxY },
            };
            lines.push(line);
        }

        for (let iY = 0; iY < this.gridSize.height; iY++) {
            const y = minY + iY * this._cellSize;
            const line: ILine = {
                from: { x: minX, y },
                to: { x: maxX, y },
            };
            lines.push(line);
        }

        plotter.drawLines(lines, Color.GREEN);
    }

    public getCellId(position: IPoint): IPoint {
        let cellX = Math.floor((position.x - this.topLeftCorner.x) / this._cellSize);
        let cellY = Math.floor((position.y - this.topLeftCorner.y) / this._cellSize);

        if (cellX < 0) {
            cellX = 0;
        } else if (cellX >= this.gridSize.width) {
            cellX = this.gridSize.width - 1;
        }

        if (cellY < 0) {
            cellY = 0;
        } else if (cellY >= this.gridSize.height) {
            cellY = this.gridSize.height - 1;
        }

        return { x: cellX, y: cellY };
    }

    public getDistanceToClosestBorder(position: IPoint): number {
        // position relative to the containing cell
        const localX = (position.x - this.topLeftCorner.x) % this._cellSize;
        const localY = (position.y - this.topLeftCorner.y) % this._cellSize;

        const minDistanceX = Math.min(localX, this._cellSize - localX);
        const minDistanceY = Math.min(localY, this._cellSize - localY);
        return Math.min(minDistanceX, minDistanceY);
    }

    /** Provides the registered items that overlap a given cell.
     * @param cellX (integer) horizontal position of the wanted cell
     * @param cellY (integer) vertical position of the wanted cell
     * @returns array of cells that overlap the wanted cell. If the wanted cell doesn't exist, returns empty array
     */
    public getItemsFromCell(cellX: number, cellY: number): PatternBase[] {
        if (cellX >= 0 && cellX < this.gridSize.width && cellY >= 0 && cellY < this.gridSize.height) {
            const cellId = this.computeCellId(cellX, cellY);
            return this.gridCells[cellId];
        }
        return [];
    }

    /** Provides the registered items that overlap a certain group of cells. Contains duplicates.
     * @param minCellX (integer) horizontal position of the lowest wanted cell
     * @param minCellY (integer) vertical position of the lowest wanted cell
     * @param maxCellX (integer) horizontal position of the highest wanted cell
     * @param maxCellY (integer) vertical position of the highest wanted cell
     * @returns array of cells that overlap the wanted group of cell. If no cell matches, returns empty array
     */
    public getItemsFromCellsGroup(minCellX: number, minCellY: number, maxCellX: number, maxCellY: number): PatternBase[] {
        const result: PatternBase[] = [];

        for (let iCellY = minCellY; iCellY <= maxCellY; iCellY++) {
            for (let iCellX = minCellX; iCellX <= maxCellX; iCellX++) {
                const cellItems = this.getItemsFromCell(iCellX, iCellY);
                result.push.apply(result, cellItems);
            }
        }

        return result;
    }

    public computeStatistics(): void {
        Statistics.registerGridStats(this.gridSize, this._cellSize, this.registeredItemsCount);
    }

    public get itemsPerCell(): number {
        if (this.gridCells.length === 0) {
            return 0;
        }
        return this.registeredItemsCount / this.gridCells.length;
    }

    public get cellSize(): number {
        return this._cellSize;
    }

    /** @returns true if the cells disposition changed */
    private resetDomain(domainSize: ISize, cellSize: number): boolean {
        const wantedGridSizeX = Math.ceil(domainSize.width / cellSize);
        const wantedGridSizeY = Math.ceil(domainSize.height / cellSize);

        if (cellSize < MIN_CELL_SIZE) {
            cellSize = MIN_CELL_SIZE;
        } else if (cellSize > MAX_CELL_SIZE) {
            cellSize = MAX_CELL_SIZE;
        }

        const hasChanged = (this._cellSize !== cellSize) ||
            (this.gridSize.width !== wantedGridSizeX) || (this.gridSize.height !== wantedGridSizeY);

        this._cellSize = cellSize;
        this.gridSize.width = wantedGridSizeX;
        this.gridSize.height = wantedGridSizeY;

        this.topLeftCorner.x = -0.5 * domainSize.width;
        this.topLeftCorner.y = -0.5 * domainSize.height;

        const nbCells = this.gridSize.width * this.gridSize.height;
        this.gridCells.length = nbCells; // reduce size if needed
        for (let i = 0; i < nbCells; i++) {
            this.gridCells[i] = []; // empty/initialize all cells
        }

        return hasChanged;
    }

    /** No check that the parameters are in bounds. */
    private computeCellId(cellX: number, cellY: number): number {
        return cellX + cellY * this.gridSize.width;
    }
}

export { Grid };