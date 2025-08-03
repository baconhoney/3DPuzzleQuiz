import { Component } from "react";

import App from "../App.tsx";

import "./QuizResultsComponent.css";


export interface QuizResult {
    teamID: number,
    name: string,
    score: number,
    timestamp: Date,
}

export interface QuizResults {
    [index: string]: QuizResult
}

interface Properties {
    app: App,
    quizResults: QuizResults,
}

interface State { }

export default class QuizResultsComponent extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
    }

    /*private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }*/

    private formatTime(localIsoDate: Date) {
        const z = (n: number) => (n > 9 ? "" : "0") + n;
        const hh = localIsoDate.getUTCHours();
        const mm = localIsoDate.getUTCMinutes();
        const ss = localIsoDate.getUTCSeconds();
        return z(hh) + ':' + z(mm) + ':' + z(ss);
    }

    render() {
        return <table className="test-results">
            <thead style={{ position: "sticky", top: "0" }}>
                <tr onClick={() => { this.props.app.setSelectedTab(null); }}>
                    <th className="groupname">Csapatnév</th>
                    <th className="score">Pont</th>
                    <th className="timestamp">Leadás ideje</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(this.props.quizResults).map(([i, elem]) => (
                    <tr key={i} onClick={() => { this.props.app.setSelectedTab(elem.teamID); }} className={elem.teamID == this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                        <td className="groupname">{elem.name}</td>
                        <td className="score">{elem.score}</td>
                        <td className="timestamp">{this.formatTime(elem.timestamp)}</td>
                    </tr>
                ))}
            </tbody>
        </table>;
    }
}
