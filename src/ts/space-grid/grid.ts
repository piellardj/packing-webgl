import { PatternBase } from "../patterns/pattern-base";
import { PlotterBase } from "../plotter/plotter-base";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

type GridCell = PatternBase[];

class Grid {
    private readonly gridSize: ISize;
    private readonly gridCells: GridCell[];
    private readonly topLeftCorner: IPoint;
    private cellSize: number;

    public totalItems: number;

    constructor(domainSize: ISize, cellSize: number) {
        this.cellSize = cellSize;
        this.gridSize = {
            width: Math.ceil(domainSize.width / cellSize),
            height: Math.ceil(domainSize.height / cellSize),
        };
        this.gridCells = [];
        this.topLeftCorner = {
            x: -0.5 * domainSize.width,
            y: -0.5 * domainSize.height,
        };
        this.totalItems = 0;
    }

    public reset(domainSize: ISize, cellSize: number, items: PatternBase[]): void {
        this.resetDomain(domainSize, cellSize);

        this.totalItems = 0;
        for (const item of items) {
            this.registerItem(item);
        }
    }

    public registerItem(item: PatternBase): void {
        if (item.needInitialization) {
            return;
        }

        this.totalItems++;

        const minX = item.center.x - 0.5 * item.size;
        const minY = item.center.y - 0.5 * item.size;
        const maxX = item.center.x + 0.5 * item.size;
        const maxY = item.center.y + 0.5 * item.size;

        const minGridX = Math.floor((minX - this.topLeftCorner.x) / this.cellSize);
        const minGridY = Math.floor((minY - this.topLeftCorner.y) / this.cellSize);
        const maxGridX = Math.floor((maxX - this.topLeftCorner.x) / this.cellSize);
        const maxGridY = Math.floor((maxY - this.topLeftCorner.y) / this.cellSize);

        for (let iCellX = minGridX; iCellX <= maxGridX; iCellX++) {
            if (iCellX >= 0 && iCellX < this.gridSize.width) {
                for (let iCellY = minGridY; iCellY <= maxGridY; iCellY++) {
                    if (iCellY >= 0 && iCellY < this.gridSize.height) {
                        const cellId = this.computeCellId(iCellX, iCellY);
                        this.gridCells[cellId].push(item);
                    }
                }
            }
        }
    }

    public draw(plotter: PlotterBase): void {
        const minX = this.topLeftCorner.x;
        const maxX = minX + this.gridSize.width * this.cellSize;

        const minY = this.topLeftCorner.y;
        const maxY = minY + this.gridSize.height * this.cellSize;

        const green = "#00FF00";
        for (let iX = 0; iX < this.gridSize.width; iX++) {
            const x = minX + iX * this.cellSize;
            plotter.drawLine({ x, y: minY }, { x, y: maxY }, 1, green);
        }

        for (let iY = 0; iY < this.gridSize.height; iY++) {
            const y = minY + iY * this.cellSize;
            plotter.drawLine({ x: minX, y }, { x: maxX, y }, 1, green);
        }
    }

    public getCellId(position: IPoint): IPoint {
        return {
            x: Math.floor((position.x - this.topLeftCorner.x) / this.cellSize),
            y: Math.floor((position.y - this.topLeftCorner.y) / this.cellSize),
        };
    }

    public getDistanceToClosestBorder(position: IPoint): number {
        // position relative to the containing cell
        const localX = (position.x - this.topLeftCorner.x) % this.cellSize;
        const localY = (position.y - this.topLeftCorner.y) % this.cellSize;

        const minDistanceX = Math.min(localX, this.cellSize - localX);
        const minDistanceY = Math.min(localY, this.cellSize - localY);
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

        for (let iCellX = minCellX; iCellX <= maxCellX; iCellX++) {
            for (let iCellY = minCellY; iCellY <= maxCellY; iCellY++) {
                const cellItems = this.getItemsFromCell(iCellX, iCellY);
                result.push.apply(result, cellItems);
            }
        }

        return result;
    }

    private resetDomain(domainSize: ISize, cellSize: number): void {
        this.cellSize = cellSize;
        this.gridSize.width = Math.ceil(domainSize.width / cellSize);
        this.gridSize.height = Math.ceil(domainSize.height / cellSize);

        this.topLeftCorner.x = -0.5 * domainSize.width;
        this.topLeftCorner.y = -0.5 * domainSize.height;

        const nbCells = this.gridSize.width * this.gridSize.height;
        this.gridCells.length = nbCells; // reduce size if needed
        for (let i = 0; i < nbCells; i++) {
            this.gridCells[i] = []; // empty/initialize all cells
        }
    }

    /** No check that the parameters are in bounds. */
    private computeCellId(cellX: number, cellY: number): number {
        return cellX + cellY * this.gridSize.width;
    }
}

export { Grid };