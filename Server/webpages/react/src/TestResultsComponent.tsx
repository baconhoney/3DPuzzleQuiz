import React, {Component} from "react";
import App from "./App";
import TestResults, {TestResult} from "./TestResults";
import "./TestResultsComponent.css";

interface Props {
    app: App
    testResults: TestResults
}

export default class TestResultsComponent extends Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    private formatTime(localIsoDate: Date) {
        const z = (n: number) => (n + "").padStart(2, "0");
        let hh = localIsoDate.getUTCHours();
        let mm = localIsoDate.getUTCMinutes();
        let ss = localIsoDate.getUTCSeconds();
        return z(hh) + ':' + z(mm) + ':' + z(ss);
    }

    render() {
        return <table>
            <thead style={{position: "sticky", top: "0"}}>
            <tr onClick={() => {
                this.props.app.setSelectedTab(null);
            }}>
                <th className="groupname">Csapatnév</th>
                <th className="lang">Nyelv</th>
                <th className="score">Pont</th>
                <th className="timestamp">Leadás ideje</th>
            </tr>
            </thead>
            <tbody>
            {this.props.testResults.map((test, i) => {
                return <tr key={i + ""} onClick={() => {
                    this.props.app.setSelectedTab(i);
                }}>
                    <td className="groupname">{"Csapatnév" /*TODO*/}</td>
                    <td className="lang">{"HU" /*TODO*/}</td>
                    <td className="score">{test.score}</td>
                    <td className="timestamp">{this.formatTime(new Date(test.timestamp))}</td>
                </tr>
            })}
            </tbody>
        </table>;
    }
}

