import { useState, useEffect } from "react";
import { useLanguage } from "./App"; // for translation `t`

const LightTheme = "light";
const DarkTheme = "dark";

export default function ThemeToggle() {
    const { t } = useLanguage();
    const [theme, setTheme] = useState(LightTheme);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = savedTheme || (prefersDark ? DarkTheme : LightTheme);
        setTheme(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === LightTheme ? DarkTheme : LightTheme;
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    return (
        <button
            className="btn btn-info btn-outline w-10"
            onClick={toggleTheme}
            aria-label={t("toggle_theme")}
            title={t("toggle_theme")}
            type="button"
        >
            {theme === LightTheme ? "🌙" : "☀️"}
        </button>
    );
}
