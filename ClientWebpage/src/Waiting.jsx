import React from 'react'

const Waiting = ({ reason }) => {

    function errorDiv() {
        switch (reason) {
            case "quiz":
                return <div>Várakozás a kvízre</div>;
            case "results":
                return <div>Várakozás az eredményekre</div>;
            default:
                return <div>Ismeretlen hiba történt</div>;
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