import React, {Component} from "react";
import {TestDataItem, TestResult} from "./TestResults";
import "./TestContentComponent.css";

interface Properties {
    result: TestResult;
}

export default class TestContentComponent extends Component<Properties> {
    constructor(properties: Properties) {
        super(properties);
    }

    render() {
        return <table className="test-content">
            <thead>
            <tr>
                <th className="testcontent-name">Név</th>
                <th className="testcontent-location">Ország, Város</th>
                <th className="testcontent-id">id</th>
                <th className="testcontent-number">Szám</th>
                <th className="testcontent-correct">Helyes</th>
            </tr>
            </thead>
            <tbody>
            {this.props.result.testData.map((line: TestDataItem, index: number) => {
                return <tr key={index.toString()}>
                    <td className="testcontent-name">{line.name}</td>
                    <td className="testcontent-location">{line.country}, ${line.city}</td>
                    <td className="testcontent-id">{line.id}</td>
                    <td className="testcontent-number">{line.number}</td>
                    <td className="testcontent-correct">{line.correct ? "Igen" : "Nem"}</td>
                </tr>
            })}
            </tbody>
        </table>;
    }
}

