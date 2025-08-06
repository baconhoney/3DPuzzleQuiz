import { Component } from "react";

import App from "../App";
import { getDetailsData } from "../Testdata";
import type { Quiz } from "../utils";

import "./QuizDetailsComponent.css";


interface Properties {
    app: App;
    teamID: number | null;
}

interface State {
    quiz: Quiz | undefined;
}

export default class QuizDetailsComponent extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.state = {
            quiz: undefined,
        };
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        this.getQuizdata();
    }

    componentDidUpdate(prevProps: Readonly<Properties>): void {
        if (prevProps.teamID !== this.props.teamID) {
            this.getQuizdata();
        }
    }

    private getQuizdata() {
        /*fetch(`/api/admin/getQuizdata?teamID=${this.props.teamID}`).then((response) => {
            response.json().then((jsonRes: JSONQuizDetails) => {
                this.updateState({
                    quiz: {
                        ...jsonRes,
                        timestamp: new Date(jsonRes.timestamp),
                    }
                })
            })
        })*/
        // temp code for testing
        const json = getDetailsData(this.props.teamID);
        this.updateState({
            quiz: json
                ? {
                    ...json,
                    timestamp: new Date(json.timestamp),
                }
                : undefined,
        });
    }

    render() {
        return (
            <table style={{ width: "80%", maxWidth: "1200px" }} className="centered">
                <thead>
                    <tr>
                        <td style={{ width: "auto" }}>
                            <span id="testGroupName" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>
                                {this.state.quiz?.name ?? "Csapatnév"}
                            </span>
                        </td>
                        <td style={{ padding: "5px 5px", width: "0px", textAlign: "center" }}>
                            <span id="testLang" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>
                                {this.state.quiz?.language.toUpperCase() ?? "Nyelv"}
                            </span>
                        </td>
                        <td style={{ padding: "5px 5px", width: "150px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span id="testScore" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                                {this.state.quiz?.score ?? "??"} / {this.state.quiz ? Object.values(this.state.quiz.questions).length : "??"}
                            </span>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={3}>
                            {this.state.quiz
                                ? <table className="answers">
                                    <thead>
                                        <tr>
                                            <th className="name">Név</th>
                                            <th className="location">Ország, Város</th>
                                            <th className="id">ID</th>
                                            <th className="number">Válasz</th>
                                            <th className="correct">Helyes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(this.state.quiz.questions).map(([index, question]) => {
                                            return (
                                                <tr key={index}>
                                                    <td className="name">{question.name}</td>
                                                    <td className="location">{question.country} {question.city != "-" ? ", " + question.city : ""}</td>
                                                    <td className="id">{question.buildingID ?? ""}</td>
                                                    <td className="answer">
                                                        <input type="number" key={question.answer} defaultValue={question.answer} id={question.buildingID.toString()} className="answer-input" />
                                                    </td>
                                                    <td className="correct">{question.correct ? "✅" : "❌"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                : "Kattints egy kvízre az részletek megjelenítésehez!"
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}
