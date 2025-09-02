import { useGlobalContext } from "./App";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ onGoBack, showBackButton = true, showThemeToggle = true }) => {

    const { teamName } = useGlobalContext();

    const goBack = () => {
        if (onGoBack) {
            onGoBack();
        } else {
            // Default go back behavior
            localStorage.removeItem("teamName");
            localStorage.removeItem("quizAnswers");
            localStorage.removeItem("teamID");
            localStorage.removeItem("quizSize");
            location.reload();
        }
    };

    return (
        <div className="navbar bg-base-200 shadow-sm px-3 sticky top-0 z-50 justify-between gap-3">
            {showBackButton && (
                <button className="btn btn-ghost btn-circle" onClick={goBack}>
                    <svg className="size-8 fill-current rtl:rotate-180" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"></path>
                    </svg>
                </button>
            )}

            <p className="text-lg font-bold truncate w-full">{teamName}</p>

            {showThemeToggle && <ThemeToggle />}
        </div>
    );
};

export default Navbar;
