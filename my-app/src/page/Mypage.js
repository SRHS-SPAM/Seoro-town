import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Users, FileText, MessageCircle, Settings, ArrowLeft, UserPlus, UserMinus, Heart, Search, X, Camera } from 'lucide-react';
import Navbar from './Navbar';
import './Mypage.css';


const ProfileSection = ({ user, stats, isMyProfile, isFollowing, onFollowToggle, onStatClick, onAvatarClick }) => (
    <div className="ProfileSection">
        <div className="ProfileHeader">
            <div className={`ProfileAvatar ${isMyProfile ? 'editable' : ''}`} onClick={onAvatarClick}>
                {user?.profileImage ? (
                    <img src={`http://localhost:3001${user.profileImage}`} alt={user.username} />
                ) : (
                    <User size={64} />
                )}
                {isMyProfile && (
                    <div className="AvatarEditOverlay"><Camera size={24} /></div>
                )}
            </div>
            <div className="ProfileInfo">
                <h2 className="ProfileName">{user?.username || '사용자'}</h2>
                <p className="ProfileEmail">{user?.email}</p>
                <p className="ProfileJoinDate">가입일: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '알 수 없음'}</p>
            </div>
            {!isMyProfile && (
                <div className="ProfileActions">
                    <button className={`FollowButton ${isFollowing ? 'following' : ''}`} onClick={onFollowToggle}>
                        {isFollowing ? <><UserMinus size={20} /><span>언팔로우</span></> : <><UserPlus size={20} /><span>팔로우</span></>}
                    </button>
                </div>
            )}
        </div>
        <div className="ProfileStats">
            <StatItem icon={<FileText size={20} />} count={stats.posts.length} label="게시글" onClick={() => onStatClick('posts')} />
            <StatItem icon={<MessageCircle size={20} />} count={stats.comments.length} label="댓글" onClick={() => onStatClick('comments')} />
            <StatItem icon={<Users size={20} />} count={stats.followers.length} label="팔로워" onClick={() => onStatClick('followers')} />
            <StatItem icon={<Heart size={20} />} count={stats.following.length} label="팔로잉" onClick={() => onStatClick('following')} />
        </div>
    </div>
);

const StatItem = ({ icon, count, label, onClick }) => (
    <div className="StatItem" onClick={onClick}>
        {icon}
        <span className="StatNumber">{count}</span>
        <span className="StatLabel">{label}</span>
    </div>
);

const SearchSection = ({ query, onQueryChange, isSearching, results, onResultClick }) => (
    <div className="SearchContainer">
        <div className="SearchInputWrapper">
            <Search size={20} className="SearchIcon" />
            <input type="text" placeholder="사용자 검색 (2자 이상)" value={query} onChange={(e) => onQueryChange(e.target.value)} className="SearchInput" />
            {query && <button onClick={() => onQueryChange('')} className="ClearButton"><X size={16} /></button>}
        </div>
        {isSearching && <div className="SearchLoading"><Settings size={16} className="LoadingIcon" /></div>}
        {results.length > 0 && (
            <div className="SearchResults">
                {results.map(user => (
                    <div key={user.id} className="SearchResultItem" onClick={() => onResultClick(user.id)}>
                        <div className="SearchResultAvatar">
                             {user.profileImage ? (
                                <img src={`http://localhost:3001${user.profileImage}`} alt={user.username} />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div className="SearchResultInfo">
                            <span className="SearchResultName">{user.username}</span>
                            <span className="SearchResultEmail">{user.email}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TabButton = ({ icon, label, name, activeTab, onClick }) => (
    <button className={`TabButton ${activeTab === name ? 'active' : ''}`} onClick={() => onClick(name)}>
        {icon} <span>{label}</span>
    </button>
);

const ContentList = ({ items, type, onPostClick, onCommentClick, onUserClick }) => {
    if (!items || items.length === 0) {
        const messages = { post: "작성한 게시글이 없습니다.", comment: "작성한 댓글이 없습니다.", user: "해당하는 사용자가 없습니다." };
        const icons = { post: <FileText size={48} />, comment: <MessageCircle size={48} />, user: <Users size={48} /> };
        return <div className="EmptyState">{icons[type]}<p>{messages[type]}</p></div>;
    }

    return (
        <div className={`${type}sList`}>
            {items.map(item => {
                if (type === 'post' && onPostClick) return <PostItem key={item.id} post={item} onClick={onPostClick} />;
                if (type === 'comment' && onCommentClick) return <CommentItem key={item.id} comment={item} onClick={onCommentClick} />;
                if (type === 'user' && onUserClick) return <UserItem key={item.id} user={item} onClick={onUserClick} />;
                return null;
            })}
        </div>
    );
};

const PostItem = ({ post, onClick }) => (
    <div className="PostItem" onClick={() => onClick(post)}>
        <div className="PostHeader">
            <span className="PostCategory">{post.category}</span>
            <span className="PostDate">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        <h4 className="PostTitle">{post.title}</h4>
        <p className="PostPreview">{post.content.substring(0, 100)}...</p>
    </div>
);

const CommentItem = ({ comment, onClick }) => (
    <div className="CommentItem" onClick={() => onClick(comment)}>
        <p className="CommentContent">{comment.content}</p>
        <div className="CommentPostInfo">
            <span>게시글: {comment.postTitle}</span>
            <span className="CommentDate">{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
    </div>
);

const UserItem = ({ user, onClick }) => (
    <div className="UserItem" onClick={() => onClick(user.id)}>
        <div className="UserAvatar">
            {user.profileImage ? (
                <img src={`http://localhost:3001${user.profileImage}`} alt={user.username} />
            ) : (
                <User size={32} />
            )}
        </div>
        <div className="UserInfo">
            <span className="UserName">{user.username}</span>
            <span className="UserEmail">{user.email}</span>
        </div>
    </div>
);


// --- 메인 컴포넌트 ---

function Mypage() {
    const { isLoggedIn, user: currentUser, token, updateUserProfileImage } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const fileInputRef = useRef(null);

    const profileUserId = location.state?.userId;
    const isMyProfile = !profileUserId || profileUserId === currentUser?.id;

    const [profileData, setProfileData] = useState({
        user: null, posts: [], comments: [], followers: [], following: [], isFollowing: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    
    const fetchAPI = useCallback(async (url) => {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
        return response.json();
    }, [token]);

    const loadProfile = useCallback(async (targetUserId) => {
        if (!token || !targetUserId) return;
        setIsLoading(true);
        try {
            const [userData, postsData, commentsData, followersData, followingData, followStatusData] = await Promise.all([
                fetchAPI(`http://localhost:3001/api/users/${targetUserId}`),
                fetchAPI(`http://localhost:3001/api/users/${targetUserId}/posts`),
                fetchAPI(`http://localhost:3001/api/users/${targetUserId}/comments`),
                fetchAPI(`http://localhost:3001/api/users/${targetUserId}/followers`),
                fetchAPI(`http://localhost:3001/api/users/${targetUserId}/following`),
                !isMyProfile ? fetchAPI(`http://localhost:3001/api/users/${targetUserId}/follow-status`) : Promise.resolve({ isFollowing: false })
            ]);

            setProfileData({
                user: userData.user, posts: postsData.posts || [], comments: commentsData.comments || [],
                followers: followersData.followers || [], following: followingData.following || [],
                isFollowing: followStatusData.isFollowing || false,
            });
        } catch (error) {
            console.error("프로필 데이터 로드 중 오류 발생:", error);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
    }, [fetchAPI, navigate, isMyProfile]);
    
    useEffect(() => {
        const targetUserId = isMyProfile ? currentUser?.id : profileUserId;
        if (targetUserId) {
            loadProfile(targetUserId);
        } else if (!isLoggedIn) {
            setIsLoading(false);
        }
    }, [profileUserId, isMyProfile, currentUser, isLoggedIn, loadProfile]);
    
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const handleSearch = async () => {
            setIsSearching(true);
            try {
                const data = await fetchAPI(`http://localhost:3001/api/users/search?query=${encodeURIComponent(searchQuery)}`);
                setSearchResults(data.users || []);
            } catch (error) {
                console.error("검색 중 오류 발생:", error);
            } finally {
                setIsSearching(false);
            }
        };
        const debounceTimer = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, fetchAPI]);
    
    const handleProfileImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profileImage', file);
        try {
            const response = await fetch('http://localhost:3001/api/users/me/profile-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            const newImageUrl = data.profileImage;
            setProfileData(prev => ({ ...prev, user: { ...prev.user, profileImage: newImageUrl } }));
            updateUserProfileImage(newImageUrl);
            alert('프로필 이미지가 변경되었습니다.');
        } catch (error) {
            alert(`업로드 실패: ${error.message}`);
        }
    };

    const handleAvatarClick = () => { if (isMyProfile) fileInputRef.current.click(); };

    const handleFollowToggle = async () => {
        if (isMyProfile) return;
        const endpoint = profileData.isFollowing ? 'unfollow' : 'follow';
        try {
            await fetch(`http://localhost:3001/api/users/${profileUserId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProfileData(prev => ({
                ...prev,
                isFollowing: !prev.isFollowing,
                followers: prev.isFollowing 
                    ? prev.followers.filter(f => f.id !== currentUser.id)
                    : [...prev.followers, { ...currentUser }]
            }));
        } catch (error) {
            console.error("팔로우/언팔로우 처리 오류:", error);
        }
    };

    const goToUserProfile = (userId) => {
        setSearchQuery('');
        setSearchResults([]);
        if (userId === currentUser?.id) {
            navigate('/Mypage', { replace: true });
        } else {
            navigate('/Mypage', { state: { userId }, replace: true });
        }
    };

    const handlePostClick = (post) => navigate(`/infoboard/${post.id}`);
    const handleCommentClick = (comment) => navigate(`/infoboard/${comment.postId}`);

    if (isLoading) {
        return <div className="LoadingContainer"><Settings size={48} className="LoadingSpinner" /><span>로딩 중...</span></div>;
    }

    if (!isLoggedIn) {
        return (
            <div className="MypageContainer">
                <div className="LoginRequired">
                    <User size={64} />
                    <h2>로그인이 필요합니다</h2>
                    <p>마이페이지를 이용하시려면 로그인해주세요.</p>
                    <button onClick={() => navigate('/login')}>로그인 페이지로</button>
                </div>
            </div>
        );
    }
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return <ContentList items={profileData.posts} type="post" onPostClick={handlePostClick} />;
            case 'comments':
                return <ContentList items={profileData.comments} type="comment" onCommentClick={handleCommentClick} />;
            case 'followers':
                return <ContentList items={profileData.followers} type="user" onUserClick={goToUserProfile} />;
            case 'following':
                return <ContentList items={profileData.following} type="user" onUserClick={goToUserProfile} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Navbar />
            <div className="MypageContainer">
                <input type="file" ref={fileInputRef} onChange={handleProfileImageChange}
                    accept="image/*" style={{ display: 'none' }} />
                {!isMyProfile && (
                    <div className="MypageHeader"><button className="BackButton" onClick={() => navigate(-1)}><ArrowLeft size={24} /> <span>뒤로가기</span></button></div>
                )}
                <ProfileSection 
                    user={profileData.user} stats={profileData} isMyProfile={isMyProfile}
                    isFollowing={profileData.isFollowing} onFollowToggle={handleFollowToggle}
                    onStatClick={setActiveTab} onAvatarClick={handleAvatarClick}
                />
                <SearchSection 
                    query={searchQuery} onQueryChange={setSearchQuery} isSearching={isSearching}
                    results={searchResults} onResultClick={goToUserProfile}
                />
                <div className="ProfileTabs">
                    <TabButton icon={<FileText size={18} />} label="게시글" name="posts" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton icon={<MessageCircle size={18} />} label="댓글" name="comments" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton icon={<Users size={18} />} label="팔로워" name="followers" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton icon={<Heart size={18} />} label="팔로잉" name="following" activeTab={activeTab} onClick={setActiveTab} />
                </div>
                <div className="ProfileContent">
                    {renderTabContent()}
                </div>
            </div>
        </>
    );
}

export default Mypage;