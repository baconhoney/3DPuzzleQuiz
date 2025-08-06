import { Component } from "react";

import App from "../App.tsx";
import { getTimeFromDate, type QuizResults } from "../utils.ts";

import "./QuizResultsComponent.css";

interface Properties {
    app: App;
    quizResults: QuizResults;
}

export default class QuizResultsComponent extends Component<Properties, unknown> {
    constructor(properties: Properties) {
        super(properties);
    }

    /*private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }*/

    render() {
        return (
            <table className="test-results">
                <thead style={{ position: "sticky", top: "0" }}>
                    <tr
                        onClick={() => {
                            this.props.app.updateState({ openedQuizTeamID: null });
                        }}>
                        <th className="groupname">Csapatnév</th>
                        <th className="score">Pont</th>
                        <th className="timestamp">Leadás ideje</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(this.props.quizResults).map(([i, elem]) => (
                        <tr key={i} onClick={() => { this.props.app.updateState({ openedQuizTeamID: elem.teamID }); }}
                            className={elem.teamID == this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                            <td className="groupname">{elem.name}</td>
                            <td className="score">{elem.score}</td>
                            <td className="timestamp">{getTimeFromDate(elem.timestamp)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}
