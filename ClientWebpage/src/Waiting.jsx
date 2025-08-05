import React from 'react'
import { useGlobalContext } from './App';

const Waiting = ({ reason }) => {

    const { t } = useGlobalContext();

    function errorDiv() {
        switch (reason) {
            case "quiz":
                return <div className='text-center p-4'>{t("waiting_for_quiz")}</div>;
            case "results":
                return <div className='text-center p-4'>{t("waiting_for_results")}</div>;
            default:
                return <div className='text-center p-4 text-error'>{t("waiting_error")}</div>;
        }
    }

    return (
        <>
            <div className='flex flex-col items-center justify-center h-full mt-10 gap-5'>
                {errorDiv()}
            </div>
        </>
    )
}

export default Waiting