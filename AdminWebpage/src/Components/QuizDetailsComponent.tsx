import { Component } from "react";

import App from "../App";
import type { QuizDetails, QuizLanguage, RawQuizDetails } from "../utils";

import "./QuizDetailsComponent.css";

import { getDetailsData } from "../Testdata";


interface Properties {
    app: App;
    teamID: number | null;
}

interface State {
    quizDetails: QuizDetails | undefined;
}

export default class QuizDetailsComponent extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.state = {
            quizDetails: undefined,
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
        const convertFn = (json: (RawQuizDetails)) => (
            {
                ...json,
                language: json.language as QuizLanguage,
                timestamp: new Date(json.timestamp),
            }
        );
        if (this.props.teamID) {
            if (import.meta.env.MODE == "production") {
                fetch(`/api/admin/getQuizdata?teamID=${this.props.teamID ?? 'null'}`).then((response) => {
                    response.json().then((json: RawQuizDetails) => {
                        this.updateState({
                            quizDetails: convertFn(json),
                        });
                    })
                });
            } else {
                // temp code for testing
                const json = getDetailsData(this.props.teamID);
                if (!json) throw new Error(`No details found for teamID ${this.props.teamID}`);
                this.updateState({
                    quizDetails: convertFn(json),
                });
            }
        } else {
            this.updateState({
                quizDetails: undefined,
            });
        }
    }

    render() {
        return (
            <table style={{ width: "80%", maxWidth: "1200px" }}>
                <thead>
                    <tr>
                        <td style={{ width: "auto" }}>
                            <span id="testGroupName" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>
                                {this.state.quizDetails?.name ?? "Csapatnév"}
                            </span>
                        </td>
                        <td style={{ padding: "5px 5px", width: "0px", textAlign: "center" }}>
                            <span id="testLang" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>
                                {this.state.quizDetails?.language.toUpperCase() ?? "Nyelv"}
                            </span>
                        </td>
                        <td style={{ padding: "5px 5px", width: "150px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span id="testScore" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                                {this.state.quizDetails?.score ?? "??"} / {this.state.quizDetails?.questions.length ?? "??"}
                            </span>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={3}>
                            {this.state.quizDetails
                                ? <table className="answers">
                                    <thead>
                                        <tr>
                                            <th className="name">Név</th>
                                            <th className="location">Elhelyezkedés</th>
                                            <th className="id">ID</th>
                                            <th className="number">Válasz</th>
                                            <th className="correct">Helyes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.quizDetails.questions.map((question, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td className="name">{question.name}</td>
                                                    <td className="location">{question.location}</td>
                                                    <td className="id">{question.id}</td>
                                                    <td className="answer">
                                                        <input type="number" key={question.answer} defaultValue={question.answer} id={question.id.toString()} className="answer-input" />
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
