import React from 'react'
import { useGlobalContext } from './App';

const WantToStart = ({ setWantToPlay }) => {

    const { t } = useGlobalContext();

    function wantToPlay() {
        localStorage.removeItem("teamID");
        setWantToPlay("Y")
    }

    return (
        <div className='flex flex-col items-center justify-center h-full mt-10 gap-5'>
            <p className='p-4 text-center'>{t("want_to_play")}</p>
            <button className='btn btn-success' onClick={wantToPlay}>{t("want_to_play_yes")}</button>
            <button className='btn btn-error' onClick={() => setWantToPlay("N")}>{t("want_to_play_no")}</button>
        </div>
    )
}

export default WantToStart