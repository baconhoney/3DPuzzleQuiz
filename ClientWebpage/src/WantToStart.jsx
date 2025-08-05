import React from 'react'
import { useGlobalContext } from './App';

const WantToStart = ({ setWantToPlay }) => {

    const { t } = useGlobalContext();

    return (
        <div className='flex flex-col items-center justify-center h-full mt-10 gap-5'>
            <p className='p-4 text-center'>{t("want_to_play_late")}</p>
            <button className='btn btn-success' onClick={() => setWantToPlay("Y")}>{t("want_to_play_yes")}</button>
            <button className='btn btn-error' onClick={() => setWantToPlay("N")}>{t("want_to_play_no")}</button>
        </div>
    )
}

export default WantToStart