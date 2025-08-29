import { Component } from "react";

import "./Controllers.css";


interface ConfirmPopupProperties {
    text?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export class ConfirmPopupComponent extends Component<ConfirmPopupProperties, unknown> {

    constructor(properties: ConfirmPopupProperties) {
        super(properties);
    }

    render() {
        return (
            <div className="confirmPopup">
                <div className="msg">{this.props.text ?? "Biztos benne?"}</div>
                <div className="buttons">
                    <button className="cancel" onClick={() => this.props.onCancel?.()}>Nem</button>
                    <button className="confirm" onClick={() => this.props.onConfirm?.()}>Igen</button>
                </div>
            </div>
        );
    }
}

interface ErrorPopupProperties {
    text?: React.ReactNode;
    onAck: () => void;
}

export class ErrorPopupComponent extends Component<ErrorPopupProperties, unknown> {

    constructor(props: ErrorPopupProperties) {
        super(props);
    }

    render() {
        return (
            <div className="errorPopup">
                <div className="msg">{this.props.text ?? "Ismeretlen hiba"}</div>
                <div className="buttons">
                    <button className="aknowledge" onClick={() => this.props.onAck()}>Ok</button>
                </div>
            </div>
        );
    }
}

