import { Component } from "react";

import App from "../App.tsx";
import { fetchData, type QuizDetails, type QuizLanguage, type JsonQuizDetails } from "../utils.ts";

import "./Details.css";
import { ConfirmPopupComponent } from "./Controllers.tsx";

import { getDetailsData } from "../Testdata.ts";


interface Props {
    app: App;
    teamID: number | null;
    confirmSaveDetailsPopupRef: React.RefObject<ConfirmPopupComponent | null>;
    confirmPrintQuizPopupRef: React.RefObject<ConfirmPopupComponent | null>;
}

interface State {
    details: QuizDetails | undefined;
    answers: { [id: number]: number };
}

export default class DetailsComponent extends Component<Props, State> {
    private inputRefs = new Map<number, HTMLInputElement | null>();

    constructor(props: Props) {
        super(props);
        this.state = {
            details: undefined,
            answers: {},
        };
    }

    private updateState(newState: Partial<State>) {
        this.setState({ ...this.state, ...newState });
    }

    componentDidMount() {
        this.getQuizdata();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.teamID !== this.props.teamID) {
            this.getQuizdata();
        }
    }

    private getQuizdata() {
        const convertFn = (json: (JsonQuizDetails)) => ({
            ...json,
            language: json.language as QuizLanguage,
        });
        if (this.props.teamID) {
            if (import.meta.env.MODE == "production") {
                fetchData(`/api/admin/getQuizdata?teamID=${this.props.teamID ?? 'null'}`, (data) => {
                    const res = convertFn(data as JsonQuizDetails);
                    this.updateState({
                        details: res,
                        answers: Object.fromEntries(res.entries.map((question) => [question.id, question.answer])),
                    });
                });
            } else {
                // temp code for testing
                const json = getDetailsData(this.props.teamID);
                if (!json) throw new Error(`No details found for teamID ${this.props.teamID}`);
                const res = convertFn(json);
                this.updateState({
                    details: res,
                    answers: Object.fromEntries(res.entries.map((question) => [question.id, question.answer])),
                });
            }
        } else {
            this.updateState({
                details: undefined,
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
                                this.state.details?.teamname
                                    ? <input value={this.state.details?.teamname} onChange={e => this.updateState({
                                        details: {
                                            ...this.state.details!, teamname: e.target.value
                                        }
                                    })} />
                                    : <span id="testGroupName" style={{ padding: "0px 5px", fontSize: "1.5rem", fontWeight: "bold" }}>"Csapatnév"</span>
                            }
                        </td>
                        <td style={{ padding: "5px 5px", width: "85px", textAlign: "center" }}>
                            <span id="testLang" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {this.state.details?.language.toUpperCase() ?? "Nyelv"}
                            </span>
                        </td>
                        <td style={{ padding: "5px 5px", width: "150px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span id="testScore" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                                {this.state.details?.score ?? "??"} / {this.state.details?.entries.length ?? "??"}
                            </span>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={3}>
                            {this.state.details
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
                                            {this.state.details.entries.map((question, index) => {
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
                                        <button onClick={() => {
                                            this.props.confirmSaveDetailsPopupRef.current!.updateState({
                                                callerData: {
                                                    teamName: this.state.details!.teamname,
                                                    answers: Object.entries(this.state.answers).map(
                                                        ([id, answer]) => ({ id: parseInt(id), answer: answer })
                                                    )
                                                }
                                            });
                                            this.props.confirmSaveDetailsPopupRef.current!.show();
                                        }}>Mentés</button>
                                        <button onClick={() => {
                                            this.props.confirmPrintQuizPopupRef.current!.updateState({
                                                callerData: {
                                                    teamID: this.props.teamID
                                                }
                                            });
                                            this.props.confirmPrintQuizPopupRef.current!.show();
                                        }}>Nyomtat</button>
                                    </div>
                                </>
                                : <p>Kattints egy kvízre az részletek megjelenítésehez!</p>
                            }
                        </td>
                    </tr>
                </tbody>
            </table >
        );
    }
}
