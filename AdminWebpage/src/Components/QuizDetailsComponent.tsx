import { Component, createRef } from "react";

import App from "../App";
import { fetchData, type QuizDetails, type QuizLanguage, type RawQuizDetails } from "../utils";

import "./QuizDetailsComponent.css";
import { ConfirmPopupComponent } from "./ControllerComponents";
import * as actions from "./../Actions.ts";

import { getDetailsData } from "../Testdata";


interface Properties {
    app: App;
    teamID: number | null;
}

interface State {
    quizDetails: QuizDetails | undefined;
    answers: { [id: number]: number };
}

export default class QuizDetailsComponent extends Component<Properties, State> {
    private confirmSaveQuizDetailsPopupRef = createRef<ConfirmPopupComponent>();
    private inputRefs = new Map<number, HTMLInputElement | null>();

    constructor(properties: Properties) {
        super(properties);
        this.state = {
            quizDetails: undefined,
            answers: {},
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
        const convertFn = (json: (RawQuizDetails)) => ({
            ...json,
            language: json.language as QuizLanguage,
            timestamp: new Date(json.timestamp),
        });
        if (this.props.teamID) {
            if (import.meta.env.MODE == "production") {
                fetchData(`/api/admin/getQuizdata?teamID=${this.props.teamID ?? 'null'}`, (data) => {
                    const res = convertFn(data as RawQuizDetails);
                    this.updateState({
                        quizDetails: res,
                        answers: Object.fromEntries(res.questions.map((question) => [question.id, question.answer])),
                    });
                });
            } else {
                // temp code for testing
                const json = getDetailsData(this.props.teamID);
                if (!json) throw new Error(`No details found for teamID ${this.props.teamID}`);
                const res = convertFn(json);
                this.updateState({
                    quizDetails: res,
                    answers: Object.fromEntries(res.questions.map((question) => [question.id, question.answer])),
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
                            {
                                this.state.quizDetails?.name
                                    ? <input value={this.state.quizDetails?.name} onChange={e => this.updateState({
                                        quizDetails: {
                                            ...this.state.quizDetails!, name: e.target.value
                                        }
                                    })} />
                                    : <span id="testGroupName" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>"Csapatnév"</span>
                            }
                        </td>
                        <td style={{ padding: "5px 5px", width: "85px", textAlign: "center" }}>
                            <span id="testLang" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
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
                                ? <>
                                    <table className="answers">
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
                                                    <tr key={question.id}>
                                                        <td className="name">{question.name}</td>
                                                        <td className="location">{question.location}</td>
                                                        <td className="id">{question.id}</td>
                                                        <td className="answer">
                                                            <input type="number" value={this.state.answers[question.id].toString()} id={question.id.toString()} className="answer-input"
                                                                ref={ref => { this.inputRefs.set(index, ref) }}
                                                                onChange={(event) => {
                                                                    this.updateState({
                                                                        answers: {
                                                                            ...this.state.answers,
                                                                            [question.id]: parseInt(event.target.value) || 0,
                                                                        },
                                                                    });
                                                                }}
                                                                onKeyUp={e => e.key == "Enter" && this.inputRefs.get(index + 1)?.select()}
                                                            />
                                                        </td>
                                                        <td className="correct">{question.correct ? "✅" : "❌"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="vert-stack" style={{ position: "absolute", top: "10px", right: "10px" }}>
                                        <button onClick={() => { this.confirmSaveQuizDetailsPopupRef.current?.show() }}>Mentés</button>
                                    </div>
                                    <ConfirmPopupComponent ref={this.confirmSaveQuizDetailsPopupRef} text="Biztosan menti a kvíz adatokat?"
                                        onConfirm={() => {
                                            this.state.quizDetails && actions.uploadAnswers(
                                                this.state.quizDetails.name,
                                                Object.entries(this.state.answers).map(
                                                    ([id, answer]) => ({ id: parseInt(id), answer: answer })
                                                ))
                                        }}
                                        onCancel={() => { }} />
                                </>
                                : <p>Kattints egy kvízre az részletek megjelenítésehez!</p>
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}
