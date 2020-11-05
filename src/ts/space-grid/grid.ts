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

    public getItems(cellX: number, cellY: number): PatternBase[] {
        const cellId = this.computeCellId(cellX, cellY);
        if (cellId >= 0 && cellId < this.gridCells.length) {
            return this.gridCells[cellId];
        }
        return [];
    }

    private resetDomain(domainSize: ISize, cellSize: number): void {
        this.cellSize=  cellSize;
        this.gridSize.width = Math.ceil(domainSize.width / cellSize);
        this.gridSize.height = Math.ceil(domainSize.height / cellSize);

        this.topLeftCorner.x = -0.5 * domainSize.width;
        this.topLeftCorner.y = -0.5 * domainSize.height;

        for (let i = 0; i < this.gridSize.width * this.gridSize.height; i++) {
            this.gridCells[i] = [];
        }
    }

    private computeCellId(cellX: number, cellY: number): number {
        return cellX + cellY * this.gridSize.width;
    }
}

export { Grid };