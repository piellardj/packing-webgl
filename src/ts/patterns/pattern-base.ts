import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

import { PlotterBase } from "../plotter/plotter-base";

import * as Helper from "../helper";

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

    public reset(domainSize: ISize, existingItems: PatternBase[]): void {
        this.color = Helper.randomHexColor();

        for (let iTry = 0; iTry < MAX_RESET_TRIES; iTry++) {
            this.randomizePosition(domainSize);

            const maxSize = 0.5 * this.computeBiggestSizePossible(existingItems);
            if (maxSize >= 8) {
                this.size = 2 * Math.floor(0.5 * maxSize); // need to be even to avoid aliasing
                this.needInitialization = false;
                return;
            }
        }

        console.log(`Failed to reset item after ${MAX_RESET_TRIES} tries.`);
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
