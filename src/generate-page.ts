import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Packing",
    description: "Simple implementation of a packing algorithm, running on CPU.",
    introduction: [
        "This is the implementation of a simple packing algorithm running on CPU. Each new item is given a random position, and then grows as big as possible without intersecting the others.",
        "You can zoom anywhere you want by using the left mouse button."
    ],
    githubProjectName: "packing-webgl",
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/main.min.js"
    ],
    indicators: [
        {
            id: "fps",
            label: "FPS"
        },
        {
            id: "items-count",
            label: "Items count"
        },
        {
            id: "items-visible-count",
            label: "Visible items count"
        },
        {
            id: "main-loop-time",
            label: "Time spent in mainLoop()"
        },
        {
            id: "draw-time",
            label: "Time spent in mainLoop.draw()"
        },
        {
            id: "update-time",
            label: "Time spent in mainLoop.update()"
        },
        {
            id: "update-reindex-time",
            label: "Time spent in mainLoop.update.reindex()"
        },
        {
            id: "update-recycle-time",
            label: "Time spent in mainLoop.update.recycle()"
        },
        {
            id: "update-zoom-time",
            label: "Time spent in mainLoop.update.zoom()"
        },
        {
            id: "items-reclycled-count",
            label: "Items recycled per second"
        },
        {
            id: "items-pending-recycling-count",
            label: "Items pending recycling"
        },
        {
            id: "items-recycling-tries-count",
            label: "Items recycling tries per frame"
        },
        {
            id: "grid-size",
            label: "Grid size"
        },
        {
            id: "grid-cell-size",
            label: "Grid cell size"
        },
        {
            id: "grid-items-per-cell",
            label: "Grid items per cell"
        },
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Pattern",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    id: "primitive-tab-id",
                    unique: true,
                    options: [
                        {
                            value: "square",
                            label: "Square",
                        },
                        {
                            value: "circle",
                            label: "Circle",
                            checked: true,
                        },
                        {
                            value: "rectangle",
                            label: "Rectangle"
                        },
                        {
                            value: "triangle",
                            label: "Triangle"
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Quantity",
                    id: "quantity-range-id",
                    min: 1,
                    max: 50,
                    value: 15,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "reset-button-id",
                    label: "Reset",
                    flat: true
                }
            ],
        },
        {
            title: "Packing",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Spacing",
                    id: "spacing-range-id",
                    min: 0.01,
                    max: 0.99,
                    value: 0.25,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Min size",
                    id: "min-size-range-id",
                    min: 1,
                    max: 20,
                    value: 2,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Packing speed",
                    id: "max-tries-per-frame-range-id",
                    min: 1,
                    max: 30,
                    value: 2,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Nesting",
                    id: "allow-overlapping-checkbox-id",
                    checked: true
                },
            ]
        },
        {
            title: "Display",
            id: "display-section",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zoom speed",
                    id: "zoom-speed-range-id",
                    min: 0,
                    max: 5,
                    value: 0.2,
                    step: 0.05
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Dark",
                    id: "black-background-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Blending",
                    id: "blending-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "High contrast",
                    id: "high-contrast-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Metrics",
                    id: "indicators-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.FileDownload,
                    id: "result-download-id",
                    label: "Download as SVG",
                    flat: true
                }
            ]
        },
        {
            title: "Debug",
            id: "debug-section",
            controls: [
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Use instancing",
                    id: "instancing-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Adaptative grid",
                    id: "adaptative-grid-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Target items/cell",
                    id: "target-items-per-gridcell-checkbox-id",
                    min: 1,
                    max: 100,
                    value: 10,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Cell size",
                    id: "cell-size-range-id",
                    min: 10,
                    max: 500,
                    value: 100,
                    step: 10
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "One cell only",
                    id: "one-cell-only-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show grid",
                    id: "show-grid-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Cell X",
                    id: "cell-x-range-id",
                    min: 0,
                    max: 20,
                    value: 0,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Cell Y",
                    id: "cell-y-range-id",
                    min: 0,
                    max: 20,
                    value: 0,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "debug-collisions-button-id",
                    label: "Go debug collisions!",
                    flat: true
                }
            ]
        },
        {
            title: "Debug collisions",
            id: "debug-collisions-section",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Type",
                    id: "collision-test-type-tab-id",
                    unique: true,
                    options: [
                        {
                            value: "primitive",
                            label: "Primitive",
                            checked: true
                        },
                        {
                            value: "point",
                            label: "Point"
                        },
                        {
                            value: "visibility",
                            label: "Visibility"
                        },
                    ]
                },
            ]
        }
    ]
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);

fse.copySync(path.join(SRC_DIR, "shaders"), path.join(DEST_DIR, "shaders"));
