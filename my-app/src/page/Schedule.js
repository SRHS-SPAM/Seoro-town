import './Boardpage.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LoginComponent } from '../App';
import Navbar from './Navbar';
function Schedule() {
    return (
        <div>
        <Navbar />
        <div className="PageContent">
            <h1>시간표</h1>
            {/*시간표 만드는 버튼*/}
        </div>
        
        </div>
    )
}

export default Schedule;