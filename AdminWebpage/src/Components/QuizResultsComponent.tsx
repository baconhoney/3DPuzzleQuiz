import { Component } from "react";

import App from "../App.tsx";
import { getTimeFromDate, type QuizLanguage, type QuizResults, type QuizSize, type RawQuizResults } from "../utils.ts";

import "./QuizResultsComponent.css";

import { getResultsData } from "../Testdata.ts";


interface QuizResultsProperties {
    app: App;
}

interface QuizResultsState {
    quizResults: QuizResults;
}

export default class QuizResultsComponent extends Component<QuizResultsProperties, QuizResultsState> {
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
        const convertFn = (json: RawQuizResults) =>
            json.map((item) => {
                return {
                    ...item,
                    language: item.language as QuizLanguage,
                    quizSize: item.size as QuizSize,
                    submittedAt: new Date(item.submittedAt),
                };
            });
        if (import.meta.env.MODE == "production") {
            fetch("/api/admin/getLeaderboard").then((response) => {
                response.json().then((json: RawQuizResults) => {
                    this.updateState({
                        quizResults: convertFn(json),
                    });
                })
            })
        } else {
            // temp code for testing
            this.updateState({
                quizResults: convertFn(getResultsData()),
            });
            clearInterval(this.quizGetterHandler);
        }
    }

    private updateState(newState: Partial<QuizResultsState>) {
        this.setState({ ...this.state, ...newState });
    }

    render() {
        return (
            <table className="quiz-results">
                <thead style={{ position: "sticky", top: "0" }}>
                    <tr
                        onClick={() => {
                            this.props.app.updateState({ openedQuizTeamID: null });
                        }}>
                        <th className="groupname">Csapatnév</th>
                        <th className="score">Pont</th>
                        <th className="timestamp">Leadás ideje</th>
                        <th className="lang">Nyelv</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.quizResults.map((elem, i) => (
                        <tr key={i} onClick={() => { this.props.app.updateState({ openedQuizTeamID: elem.teamID }); }}
                            className={elem.teamID === this.props.app.state.openedQuizTeamID ? "selected" : ""}>
                            <td className="groupname">{elem.name}</td>
                            <td className="score">{elem.score}</td>
                            <td className="timestamp">{getTimeFromDate(elem.submittedAt)}</td>
                            <td className="lang">{elem.language}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}
