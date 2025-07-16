/** A single test entry */
export interface TestDataItem {
    name: string;
    country: string;
    city: string;
    number: number;
    correct: boolean;
    id: number;
}

/** One test run, containing multiple entries plus score & timestamp */
export interface TestResult {
    testData: TestDataItem[];
    score: number;
    timestamp: string; // ISO‑8601 timestamp string, e.g. "2025-07-11T11:15:27.878"
}

/** The overall payload is an array of TestResult objects */
type TestResults = TestResult[];
export default TestResults;

