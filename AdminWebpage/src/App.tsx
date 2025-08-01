import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Component } from "react";
import QuizComponent from "./Components/QuizComponent.tsx";
import QuizResultsComponent from "./Components/QuizResultsComponent.tsx";
import "./App.css";

interface Properties { }

interface State {
    openedQuizTeamID: number | null
}

export default class App extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.state = {
            openedQuizTeamID: null
        };
    }

    setSelectedTab(tab: number | null) {
        this.setState({
            ...this.state,
            openedQuizTeamID: tab
        });
    }

    render() {
        return <div id="main-cell">
            <div id="main-left-cell" style={{ position: "relative" }}>
                <QuizComponent app={this} />
                <div className="vert-stack" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button>Mentés</button>
                    <button>Törlés</button>
                </div>
            </div>

            <div id="main-right-cell">
                <div id="main-top-right-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ overflow: 'auto' }}>
                            <QuizResultsComponent app={this} />
                        </div>
                    </div>
                </div>

                <div id="main-bottom-right-cell">
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <span style={{ marginRight: '5px' }}>Idő lejár:</span>
                                    <span id="timeLeft">HH:mm</span>
                                </td>
                                <td className="vert-stack">
                                    <button style={{ width: '50px', height: '50px' }}>+</button>
                                    <button style={{ width: '50px', height: '50px' }}>-</button>
                                </td>
                                <td>
                                    <button style={{ width: '100px', height: '50px' }}>Beállít</button>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={3}>
                                    <button style={{ width: '200px', height: '120px' }}>
                                        next phase
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    }
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)

