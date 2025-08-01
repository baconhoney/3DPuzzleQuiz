import React, {Component, ReactNode} from "react";
import TestResults, {TestResult} from "./TestResults";
import TestContentComponent from "./TestContentComponent";
import TestResultsComponent from "./TestResultsComponent";

interface Properties {
    initialResults?: TestResults
}

interface State {
    testResults?: TestResults;
    selectedTab: number | null
}

export default class App extends Component<Properties, State> {
    constructor(properties: Properties) {
        super(properties);
        this.state = {
            selectedTab: null,
            testResults: properties.initialResults
        };
    }

    setSelectedTab(tab: number | null) {
        this.setState({
            ...this.state,
            selectedTab: tab
        });
    }

    render() {
        return <>
            <div id="main-cell">
                <div id="main-left-cell" style={{position: "relative"}}>
                    <table style={{width: '80%', maxWidth: '1200px'}} className="centered">
                        <thead>
                        <tr>
                            <td style={{width: 'auto'}}>
                                <span id="testGroupName" style={{padding: '0px 5px', fontSize: '1.5rem'}}>Csapatnév</span>
                            </td>
                            <td style={{width: '45px', textAlign: 'center'}}>
                                <span id="testLang" style={{padding: '0px 5px'}}>HU</span>
                            </td>
                            <td style={{padding: '0px 5px', width: '120px', textAlign: 'center'}}>
                                <span id="testScore" style={{fontSize: '2rem'}}>14</span>
                            </td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td colSpan={3}>
                                {this.state.testResults && this.state.selectedTab
                                    ? <TestContentComponent result={this.state.testResults[this.state.selectedTab]}/>
                                    : "Válassz ki egy tesztet a megtekintéshez..."
                                }
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    <div className="vert-stack" style={{position: 'absolute', top: '10px', right: '10px'}}>
                        <button>Mentés</button>
                        <button>Törlés</button>
                    </div>
                </div>

                <div id="main-right-cell">
                    <div id="main-top-right-cell">
                        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                            <div style={{overflow: 'auto'}}>
                                {this.state.testResults
                                    ? <TestResultsComponent app={this} testResults={this.state.testResults}/>
                                    : "No test results"
                                }
                            </div>
                        </div>
                    </div>

                    <div id="main-bottom-right-cell">
                        <table>
                            <tbody>
                            <tr>
                                <td>
                                    <span style={{marginRight: '5px'}}>Idő lejár:</span>
                                    <span id="timeLeft">HH:mm</span>
                                </td>
                                <td className="vert-stack">
                                    <button style={{width: '50px', height: '50px'}}>+</button>
                                    <button style={{width: '50px', height: '50px'}}>-</button>
                                </td>
                                <td>
                                    <button style={{width: '100px', height: '50px'}}>Beállít</button>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={3}>
                                    <button style={{width: '200px', height: '120px'}}>
                                        next phase
                                    </button>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    }
}

