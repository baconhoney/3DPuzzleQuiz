import { Component } from "react";
import App from "../App.tsx";
import "./QuizResultsComponent.css";

interface Properties {
    app: App,
}

interface State {
    quizResults: QuizResult[],
    quizGetterHandler?: number | undefined,
}

export interface QuizResult {
    teamID: number,
    name: string,
    score: number,
    timestamp: Date,
}

export default class QuizResultsComponent extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.setState({
            quizResults: [],
            quizGetterHandler: setInterval(this.getQuizzes, 10000),
        });
        // initial call
        this.getQuizzes();
    }

    destructor() {
        clearInterval(this.state.quizGetterHandler);
    }

    private getQuizzes() {
        fetch("/api/admin/getQuizResults").then((response) => {
            response.json().then((data: QuizResult[]) => {
                this.state = {
                    ...this.state,
                    quizResults: data
                }
            })
        })
    }

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
                <tr onClick={() => {
                    this.props.app.setSelectedTab(null);
                }}>
                    <th className="groupname">Csapatnév</th>
                    <th className="score">Pont</th>
                    <th className="timestamp">Leadás ideje</th>
                </tr>
            </thead>
            <tbody>
                {this.state.quizResults.map((quiz, index) => {
                    return <tr key={index.toString()} onClick={() => {
                        this.props.app.setSelectedTab(quiz.teamID);
                    }}>
                        <td className="groupname">{quiz.name}</td>
                        <td className="score">{quiz.score}</td>
                        <td className="timestamp">{this.formatTime(quiz.timestamp)}</td>
                    </tr>
                })}
            </tbody>
        </table>;
    }
}

