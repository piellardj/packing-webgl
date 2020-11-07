import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Packing",
    description: "Simple implementation of a packing algorithm, running on CPU.",
    introduction: [
        "PLACEHOLDER_INTRODUCTION"
    ],
    githubProjectName: "packing",
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
            id: "frame-time",
            label: "Frame time"
        },
        {
            id: "draw-time",
            label: "Time spent in draw()"
        },
        {
            id: "update-time",
            label: "Time spent in update()"
        },
        {
            id: "items-count",
            label: "Total items"
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
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Packing",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    id: "primitive-tab-id",
                    unique: true,
                    options: [
                        {
                            value: "square",
                            label: "Square",
                            checked: true
                        },
                        {
                            value: "circle",
                            label: "Circle"
                        }
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Spacing",
                    id: "spacing-range-id",
                    min: 0.01,
                    max: 0.99,
                    value: 0.5,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Min size",
                    id: "min-size-range-id",
                    min: 1,
                    max: 20,
                    value: 6,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Overlap",
                    id: "allow-overlapping-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "new-item-button-id",
                    label: "New item",
                    flat: true
                },
            ]
        },
        {
            title: "Display",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zoom speed",
                    id: "zoom-speed-range-id",
                    min: 0,
                    max: 5,
                    value: 0,
                    step: 0.05
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Black background",
                    id: "black-background-checkbox-id",
                    checked: true
                },
            ]
        },
        {
            title: "Debug",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Max tries per frame",
                    id: "max-tries-per-frame-range-id",
                    min: 100,
                    max: 10000,
                    value: 200,
                    step: 100
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
            ]
        },
        {
            title: "Output",
            controls: [
                {
                    type: Demopage.supportedControls.FileDownload,
                    id: "result-download-id",
                    label: "Download as SVG",
                    flat: true
                }
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
