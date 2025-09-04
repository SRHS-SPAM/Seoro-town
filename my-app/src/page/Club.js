import React, { useState } from 'react';
import LinkifiedText from '../components/LinkifiedText';
import './Club.css';

function Club() {
    const [selectedClub, setSelectedClub] = useState(null);

    const clubs = [
        { id: 1, name: 'DoubleM', popupImage: '/DoubleM.jpg', description: '안녕하세요. 서울로봇고등학교 전공자율동아리 DoubleM입니다. \n  아두이노와 라즈베리파이등을 활용하여 다양한 로봇들을 제작하고 있습니다!\n Notion:https://horn-flame-f50.notion.site/DoubleM-1f047aeeaf0880f3b3d3e79027a79ac5' },
        { id: 2, name: 'CreRobot', popupImage: '/CreRobot.jpg', description: '저희 크레로봇은 로보티즈 사의 다이나믹셀 및 여러가지 제어기를 활용하여  창작로봇 및 휴머로이드를 직접 제작해볼수 있는 동아리입니다.\n 이 외에도 자신이 만든 창작 로봇을 가지고 로보플러스 직업박람회등 다양한 대회도 참여하여 자신의 커리어를 쌓아 나갈수있습니다' },
        { id: 3, name: 'SPAM', popupImage: '/SPAM.jpg', description: '서울로봇고등학교의 유일한 플랫폼 개발 동아리 입니다.\n WEB, APP, UIUX DESIGN, SERVER, GAME 등의 다양한 분야를 공부하며 자신의 역량을 키울 수 있습니다. \n 또한 컨퍼런스와 각종 대회에 참가하며 많은 발표와 입상을 통해 폭 넓은 동아리활동을 할 수 있습니다. \n Github:https://github.com/SRHS-SPAM' },
        { id: 4, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 5, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 6, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 7, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 8, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 9, name: '신청하세요', popupImage: '/white.jpg', description: '' },
        { id: 10, name: '신청하세요', popupImage: '/white.jpg', description: '' }
    ];

    const handleClubClick = (club) => {
        setSelectedClub(club);
    };

    const closePopup = () => {
        setSelectedClub(null);
    };

    return (
        <div>
            
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
                        <div className="PopupClub" onClick={(e) => e.stopPropagation()}>
                            <button className="CloseButton" onClick={closePopup}>×</button>
                            <div className="PopupImageContainer">
                                <img src={selectedClub.popupImage} alt={selectedClub.name} className="PopupImage" />
                            </div>
                            <h2 className="PopupTitle">{selectedClub.name}</h2>
                            <div className="PopupDescription">
                                <LinkifiedText text={selectedClub.description} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Club;