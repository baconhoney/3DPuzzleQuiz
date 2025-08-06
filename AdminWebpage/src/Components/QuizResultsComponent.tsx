import { Component } from "react";

import App from "../App.tsx";
import { getTimeFromDate, type QuizResults } from "../utils.ts";

import "./QuizResultsComponent.css";

import { getResultsData } from "../Testdata.ts";


interface QuizResultsProperties {
    app: App;
}

interface QuizResultsState {
    quizResults: QuizResults;
}

export default class QuizResultsComponent extends Component<QuizResultsProperties, unknown> {
    private quizGetterHandler: number | undefined = undefined;

    constructor(properties: QuizResultsProperties) {
        super(properties);
        this.state = {
            quizResults: [],
        };
    }

    componentDidMount() {
        this.quizGetterHandler = setTimeout(() => {
            this.quizGetterHandler = setInterval(() => this.getQuizzes(), 10000);
            this.getQuizzes();
        }, 100);
    }

    componentWillUnmount() {
        clearTimeout(this.quizGetterHandler);
        clearInterval(this.quizGetterHandler);
    }

    private getQuizzes() {
        /*fetch("/api/admin/getQuizResults").then((response) => {
            response.json().then((data: QuizResult[]) => {
                this.updateState({
                    quizResults: data
                    })
                    })
                    })*/
        // temp code for testing
        const json = getResultsData();
        const result: QuizResults = [];
        for (const key in json) {
            const item = json[key];
            result[key] = {
                ...item,
                timestamp: new Date(item.timestamp),
            };
        }
        this.updateState({
            quizResults: result,
        });
        clearInterval(this.quizGetterHandler);
    }

    private updateState(newState: Partial<QuizResultsState>) {
        this.setState({ ...this.state, ...newState });
    }

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
