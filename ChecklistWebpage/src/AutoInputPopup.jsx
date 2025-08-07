import { useState, useEffect, useRef } from "react";

export default function AutoInputPopup({ onSearch, onClose }) {
    const [input, setInput] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (input.trim() !== "") {
                onSearch(input.trim());
                setInput("");
            }
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 bg-yellow-200 bg-opacity-90 border-b border-yellow-500 shadow-md z-50 flex items-center px-4 py-2 space-x-2"
            role="alert"
        >
            <span className="font-semibold text-yellow-800">Auto Input:</span>
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type text and press Enter"
                className="input input-sm max-w-xs flex-grow"
            />
            <button
                onClick={onClose}
                aria-label="Close Auto Input"
                className="btn btn-sm btn-ghost text-yellow-800 hover:text-yellow-900"
            >
                ✕
            </button>
        </div>
    );
}
