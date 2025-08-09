export default function ThemeToggle({ theme, setTheme }) {
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
    };

    return (
        <button
            className="btn btn-sm btn-outline btn-info w-10"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}
