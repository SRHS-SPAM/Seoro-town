import React, { useState } from 'react';
import Navbar from './Navbar';
import './Club.css';

function Club() {
    const [selectedClub, setSelectedClub] = useState(null);

    const clubs = [
        { id: 1, name: '신청하세요', popupImage: '/club1.jpg', description: '' },
        { id: 2, name: '신청하세요', popupImage: '/club2.jpg', description: '' },
        { id: 3, name: 'SPAM', popupImage: '/club3.jpg', description: '' },
        { id: 4, name: '신청하세요', popupImage: '/club4.jpg', description: '' },
        { id: 5, name: '신청하세요', popupImage: '/club5.jpg', description: '' },
        { id: 6, name: '신청하세요', popupImage: '/club6.jpg', description: '' },
        { id: 7, name: '신청하세요', popupImage: '/club7.jpg', description: '' },
        { id: 8, name: '신청하세요', popupImage: '/club8.jpg', description: '' },
        { id: 9, name: '신청하세요', popupImage: '/club9.jpg', description: '' },
        { id: 10, name: '신청하세요', popupImage: '/club10.jpg', description: '' }
    ];

    const handleClubClick = (club) => {
        setSelectedClub(club);
    };

    const closePopup = () => {
        setSelectedClub(null);
    };

    return (
        <div>
            <Navbar />
            <div className="ClubContainer">
                <div className="ClubHeader">
                    <h1>동아리 안내</h1>
                </div>

                <div className="ClubGrid">
                    {clubs.map((club) => (
                        <div 
                            key={club.id} 
                            className="ClubCard" 
                            onClick={() => handleClubClick(club)}
                        >
                            <h3 className="ClubName">{club.name}</h3>
                        </div>
                    ))}
                </div>

                {selectedClub && (
                    <div className="PopupOverlay" onClick={closePopup}>
                        <div className="PopupContent" onClick={(e) => e.stopPropagation()}>
                            <button className="CloseButton" onClick={closePopup}>×</button>
                            <div className="PopupImageContainer">
                                <img src={selectedClub.popupImage} alt={selectedClub.name} className="PopupImage" />
                            </div>
                            <h2 className="PopupTitle">{selectedClub.name}</h2>
                            <div className="PopupDescription">
                                <p>{selectedClub.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Club;