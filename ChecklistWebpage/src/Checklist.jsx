import { useEffect, useState } from "react";
import ChecklistGroup from "./ChecklistGroup";
import ThemeToggle from "./ThemeToggle";
import AutoInputPopup from "./AutoInputPopup";
import { Eye, EyeOff } from "lucide-react"; // 👈 install lucide-react if not yet: npm i lucide-react

const STORAGE_KEY = "checklist-state";
const THEME_KEY = "theme";

export default function Checklist() {
    const [data, setData] = useState([]);
    const [state, setState] = useState({});
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    });
    const [isLoaded, setIsLoaded] = useState(false);

    const [showAutoInput, setShowAutoInput] = useState(false);
    const [hideChecked, setHideChecked] = useState(false); // 👈 new state

    useEffect(() => {
        fetch("/checklist/data.json")
            .then((res) => res.json())
            .then((json) => {
                setData(json);

                const savedState = localStorage.getItem(STORAGE_KEY);
                if (savedState) {
                    try {
                        setState(JSON.parse(savedState));
                    } catch {
                        setState({});
                    }
                }

                setIsLoaded(true);
            })
            .catch(() => {
                setData([]);
                setIsLoaded(true);
            });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state, isLoaded]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggle = (key) => {
        setState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const reset = () => {
        if (confirm("Reset all progress?")) {
            const emptyState = {};
            setState(emptyState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
        }
    };

    const handleAutoCheck = (searchText) => {
        if (!searchText) return;

        const croppedSearch = searchText.includes("|") ? searchText.split("|")[0].trim() : searchText.trim();
        const lowerSearch = croppedSearch.toLowerCase();

        const newState = { ...state };

        const checkItemsRecursively = (items, groupTitle = "") => {
            items.forEach((item) => {
                if (typeof item === "string") {
                    if (item.toLowerCase().includes(lowerSearch)) {
                        const key = `${groupTitle}__${item}`;
                        newState[key] = true;
                    }
                } else if (typeof item === "object" && item !== null) {
                    if (item.items) {
                        checkItemsRecursively(item.items, item.title || groupTitle);
                    }
                }
            });
        };

        checkItemsRecursively(data);

        setState(newState);
    };

    const sortedData = data.slice().sort((a, b) => {
        return (
            a.category.localeCompare(b.category) ||
            a.subcategory.localeCompare(b.subcategory) ||
            a.title.localeCompare(b.title)
        );
    });

    const categories = [...new Set(sortedData.map((g) => g.category))];

    return (
        <div className="min-h-screen bg-base-200 text-base-content p-2">
            <div className="max-w-3xl mx-auto relative mb-2 flex justify-between items-center">
                <button
                    className="btn btn-sm border border-black px-4 whitespace-nowrap"
                    onClick={() => setShowAutoInput(true)}
                >
                    Auto Input
                </button>
                <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-bold">
                    Ellenőrző Lista 2025
                </h1>
                <div className="flex items-center gap-2">
                    {/* 👇 new toggle button */}
                    <button
                        onClick={() => setHideChecked(!hideChecked)}
                        className="btn btn-sm border border-black"
                        title={hideChecked ? "Show Checked Items" : "Hide Checked Items"}
                    >
                        {hideChecked ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
            </div>

            {showAutoInput && (
                <AutoInputPopup
                    onSearch={handleAutoCheck}
                    onClose={() => setShowAutoInput(false)}
                />
            )}

            <div className="max-w-4xl mx-auto space-y-4">
                {categories.length === 0 && (
                    <p className="text-center text-sm italic text-base-content/70">Loading checklist…</p>
                )}

                {categories.map((category) => (
                    <section key={category}>
                        <h2 className="text-base font-semibold mb-1 border-b border-primary pb-1">{category}</h2>
                        <div className="space-y-2">
                            {sortedData
                                .filter((g) => g.category === category)
                                .map((group, i) => (
                                    <ChecklistGroup
                                        key={i}
                                        group={group}
                                        state={state}
                                        toggle={toggle}
                                        hideChecked={hideChecked} // 👈 pass down
                                    />
                                ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-4 flex justify-center">
                <button onClick={reset} className="btn btn-outline btn-error btn-sm">
                    Reset All
                </button>
            </div>
        </div>
    );
}
