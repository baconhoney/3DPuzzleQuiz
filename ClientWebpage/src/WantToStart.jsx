import React from 'react'

const WantToStart = ({ setWantToPlay }) => {
    return (
        <div className='flex flex-col items-center justify-center h-full mt-10 gap-5'>
            <p>Want to start the quiz?</p>
            <button className='btn btn-success' onClick={() => setWantToPlay("Y")}>Start Quiz</button>
            <button className='btn btn-error' onClick={() => setWantToPlay("N")}>Don't Start Quiz</button>
        </div>
    )
}

export default WantToStart