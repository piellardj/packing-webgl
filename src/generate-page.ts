import * as fs from "fs";
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
    indicators: [],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Parameters",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Primitive",
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
                    title: "Density",
                    id: "density-range-id",
                    min: 0,
                    max: 1,
                    value: 0.75,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "new-item-button-id",
                    label: "New item",
                    flat: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zoom speed",
                    id: "zoom-speed-range-id",
                    min: 0,
                    max: 1,
                    value: 0,
                    step: 0.01
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
