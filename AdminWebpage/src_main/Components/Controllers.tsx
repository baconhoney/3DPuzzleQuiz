import { Component } from "react";

import "./Controllers.css";


interface ConfirmPopupProperties {
    text?: string;
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
                <p>{this.props.text ?? "Biztos benne?"}</p>
                <div>
                    <button className="cancel" onClick={() => this.props.onCancel?.()}>Nem</button>
                    <button className="confirm" onClick={() => this.props.onConfirm?.()}>Igen</button>
                </div>
            </div>
        );
    }
}
