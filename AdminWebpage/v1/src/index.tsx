import {createRoot} from "react-dom/client";
import React, {StrictMode} from "react";
import App from "./App";
import "./admin.css";
import TestResults from "./TestResults";

import testSheets from "./test_sheets.json";
let results: TestResults = testSheets;

const root = createRoot(document.getElementById("root")!);
root.render(
    <StrictMode>
        <App initialResults={results}/>
    </StrictMode>
);

