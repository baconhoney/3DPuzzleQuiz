import React from 'react'
import { useGlobalContext } from './App';
import { downloadResults as downloadResultsAPI } from './apiHandler';

const WantToStart = ({ setWantToPlay }) => {

    const [error, setError] = React.useState(null);

    const { t } = useGlobalContext();

    function wantToPlay() {
        localStorage.removeItem("teamID");
        setWantToPlay("Y")
    }

    async function downloadResults() {
        try {
            console.log("Downloading results...");

            const teamID = localStorage.getItem("teamID");
            const teamName = localStorage.getItem("teamName");

            const blob = await downloadResultsAPI(teamID);
            const element = document.createElement("a");
            element.href = URL.createObjectURL(blob);
            element.download = `quiz_results_${teamName}.pdf`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (error) {
            console.error("Failed to download results:", error);
            setError(error.message);
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-full mt-10 gap-5'>
            <p className='p-4 text-center'>{t("want_to_play")}</p>
            <button className='btn btn-info' onClick={downloadResults}>{t("download_results")}</button>
            {error && <p className="bg-error rounded-full text-black p-2">{error}</p>}
            <div></div>
            <button className='btn btn-success' onClick={wantToPlay}>{t("want_to_play_yes")}</button>
            <button className='btn btn-error' onClick={() => setWantToPlay("N")}>{t("want_to_play_no")}</button>
        </div>
    )
}

export default WantToStart