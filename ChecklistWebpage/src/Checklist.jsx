import { useEffect, useState } from "react";
import ChecklistGroup from "./ChecklistGroup";
import ThemeToggle from "./ThemeToggle";

const STORAGE_KEY = "checklist-state";
const THEME_KEY = "theme";

export default function Checklist() {
    const [data, setData] = useState([]);
    const [state, setState] = useState({});
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        fetch("/checklist/data.json")
            .then((res) => res.json())
            .then(setData)
            .catch(() => setData([]));

        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) setState(JSON.parse(savedState));
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggle = (key) => {
        setState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const reset = () => {
        if (confirm("Are you sure you want to reset all progress?")) {
            setState({});
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const sortedData = data.slice().sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        if (a.subcategory < b.subcategory) return -1;
        if (a.subcategory > b.subcategory) return 1;
        if (a.title < b.title) return -1;
        if (a.title > b.title) return 1;
        return 0;
    });

    const categories = [...new Set(sortedData.map((g) => g.category))];

    return (
        <div className="flex flex-col min-h-screen bg-base-200 text-base-content px-2 py-2">
            <div className="max-w-3xl mx-auto flex items-center justify-center relative mb-2">
                <h1 className="text-xl font-bold select-none">Checklist</h1>
            </div>
            <div className="absolute right-2 top-2">
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>

            <div className="max-w-4xl mx-auto flex-grow space-y-6">
                {categories.length === 0 && (
                    <p className="text-center text-base-content/70 italic text-sm">Loading checklist data…</p>
                )}

                {categories.map((category) => (
                    <section key={category}>
                        <h2 className="text-xl font-semibold mb-2 border-b border-primary pb-1 select-none">
                            {category}
                        </h2>

                        <div className="space-y-4">
                            {sortedData
                                .filter((group) => group.category === category)
                                .map((group, i) => (
                                    <ChecklistGroup
                                        key={i}
                                        group={group}
                                        state={state}
                                        toggle={toggle}
                                    />
                                ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="max-w-4xl mx-auto mt-4 flex justify-center">
                <button
                    onClick={reset}
                    className="btn btn-outline btn-error btn-sm font-semibold"
                >
                    Reset All
                </button>
            </div>
        </div>
    );
}
