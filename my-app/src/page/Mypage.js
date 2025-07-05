import './Mypage.css';
import { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { User, Users, FileText, MessageCircle, Settings, ArrowLeft, UserPlus, UserMinus, Heart, Search, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Mypage() {
    const { isLoggedIn, user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // URL 파라미터 또는 state에서 사용자 정보 가져오기
    const viewUserId = location.state?.userId || user?.id;
    const isOwnProfile = !location.state?.userId || location.state?.userId === user?.id;
    
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('posts'); // posts, comments, followers, following
    const [stats, setStats] = useState({
        postsCount: 0,
        commentsCount: 0,
        followersCount: 0,
        followingCount: 0
    });

    // 사용자 검색 관련 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    useEffect(() => {
        if (isLoggedIn && viewUserId) {
            loadProfileData();
        }
    }, [isLoggedIn, viewUserId]);

    // 검색 기능
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(`http://localhost:3001/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data.users || []);
                        setShowSearchResults(true);
                    } else {
                        console.error('사용자 검색 실패:', response.status);
                        setSearchResults([]);
                    }
                } catch (error) {
                    console.error('사용자 검색 오류:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, token]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadUserProfile(),
                loadUserPosts(),
                loadUserComments(),
                loadFollowData()
            ]);
        } catch (error) {
            console.error('프로필 데이터 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    // 사용자 프로필 정보 로드
    const loadUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/users/${viewUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setProfileUser(data.user);
            } else {
                console.error('사용자 프로필 로드 실패:', response.status);
            }
        } catch (error) {
            console.error('사용자 프로필 로드 오류:', error);
        }
    };

    // 사용자 게시글 로드
    const loadUserPosts = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/users/${viewUserId}/posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setUserPosts(data.posts || []);
                setStats(prev => ({ ...prev, postsCount: data.posts?.length || 0 }));
            } else {
                console.error('사용자 게시글 로드 실패:', response.status);
            }
        } catch (error) {
            console.error('사용자 게시글 로드 오류:', error);
        }
    };

    // 사용자 댓글 로드
    const loadUserComments = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/users/${viewUserId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setUserComments(data.comments || []);
                setStats(prev => ({ ...prev, commentsCount: data.comments?.length || 0 }));
            } else {
                console.error('사용자 댓글 로드 실패:', response.status);
            }
        } catch (error) {
            console.error('사용자 댓글 로드 오류:', error);
        }
    };

    // 팔로우 데이터 로드
    const loadFollowData = async () => {
        try {
            const requests = [
                fetch(`http://localhost:3001/api/users/${viewUserId}/followers`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3001/api/users/${viewUserId}/following`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ];

            // 자신의 프로필이 아닐 경우에만 팔로우 상태 확인
            if (!isOwnProfile) {
                requests.push(
                    fetch(`http://localhost:3001/api/users/${viewUserId}/follow-status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                );
            }

            const responses = await Promise.all(requests);
            const [followersRes, followingRes, followStatusRes] = responses;

            if (followersRes.ok) {
                const followersData = await followersRes.json();
                setFollowers(followersData.followers || []);
                setStats(prev => ({ ...prev, followersCount: followersData.followers?.length || 0 }));
            } else {
                console.error('팔로워 데이터 로드 실패:', followersRes.status);
            }

            if (followingRes.ok) {
                const followingData = await followingRes.json();
                setFollowing(followingData.following || []);
                setStats(prev => ({ ...prev, followingCount: followingData.following?.length || 0 }));
            } else {
                console.error('팔로잉 데이터 로드 실패:', followingRes.status);
            }

            if (followStatusRes && followStatusRes.ok) {
                const statusData = await followStatusRes.json();
                setIsFollowing(statusData.isFollowing);
            } else if (followStatusRes && !followStatusRes.ok) {
                console.error('팔로우 상태 확인 실패:', followStatusRes.status);
            }
        } catch (error) {
            console.error('팔로우 데이터 로드 오류:', error);
        }
    };

    // 팔로우/언팔로우 처리
    const handleFollowToggle = async () => {
        try {
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            const response = await fetch(`http://localhost:3001/api/users/${viewUserId}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(!isFollowing);
                // 팔로워 수 업데이트
                setStats(prev => ({
                    ...prev,
                    followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
                }));
                // 팔로우 데이터 새로고침
                await loadFollowData();
                console.log(data.message);
            } else {
                const errorData = await response.json();
                alert(errorData.message || '팔로우 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('팔로우 처리 오류:', error);
            alert('팔로우 처리 중 오류가 발생했습니다.');
        }
    };

    // 게시글 클릭 핸들러
    const handlePostClick = (post) => {
        navigate('/infoboard', { state: { post } });
    };

    // 댓글 클릭 핸들러 (게시글로 이동)
    const handleCommentClick = (comment) => {
        // 댓글이 달린 게시글로 이동
        navigate('/infoboard', { state: { postId: comment.postId } });
    };

    // 프로필 클릭 핸들러 (다른 사용자 프로필로 이동)
    const handleUserProfileClick = (userId) => {
        if (userId === user?.id) {
            // 자신의 프로필로 이동
            navigate('/Mypage');
        } else {
            // 다른 사용자 프로필로 이동
            navigate('/Mypage', { state: { userId } });
        }
        // 검색 결과 닫기
        setShowSearchResults(false);
        setSearchQuery('');
    };

    // 검색 결과에서 사용자 클릭
    const handleSearchResultClick = (userId) => {
        handleUserProfileClick(userId);
    };

    // 검색창 초기화
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const handleBackClick = () => {
        navigate('/');
    };

    // 공통 네비게이션 바 컴포넌트
    const NavigationBar = () => (
        <div className="NavBar">
            <div className="NavLeft">
                <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
                <span className="BrandName">ROBOTOWN</span>
            </div>
            <div className="NavCenter">
                <NavLink to="/" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>게시판</NavLink>
                <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>시간표</NavLink>
                <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
                <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>급식</NavLink>
                <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
                <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
                <NavLink to="/Mypage" className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>마이페이지</NavLink>
            </div>
            <LoginComponent />
        </div>
    );

    // 로그인이 필요한 경우
    if (!isLoggedIn) {
        return (
            <div>
                <NavigationBar />
                <div className="MypageContainer">
                    <div className="LoginRequired">
                        <User size={64} />
                        <h2>로그인이 필요합니다</h2>
                        <p>마이페이지를 이용하시려면 로그인해주세요.</p>
                        <button onClick={() => navigate('/')}>
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 로딩 중인 경우
    if (loading) {
        return (
            <div>
                <NavigationBar />
                <div className="MypageContainer">
                    <div className="LoadingContainer">
                        <div className="LoadingSpinner">
                            <Settings size={48} />
                        </div>
                        <p>프로필 정보를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentUser = profileUser || user;

    return (
        <div>
            <NavigationBar />

            <div className="MypageContainer">
                {!isOwnProfile && (
                    <div className="MypageHeader">
                        <button className="BackButton" onClick={handleBackClick}>
                            <ArrowLeft size={24} />
                            <span>뒤로가기</span>
                        </button>
                    </div>
                )}

                <div className="ProfileSection">
                    <div className="ProfileHeader">
                        <div className="ProfileAvatar">
                            <User size={64} />
                        </div>
                        <div className="ProfileInfo">
                            <h2 className="ProfileName">{currentUser?.username || '사용자'}</h2>
                            <p className="ProfileEmail">{currentUser?.email}</p>
                            <p className="ProfileJoinDate">
                                가입일: {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ko-KR') : '알 수 없음'}
                            </p>
                        </div>
                        {!isOwnProfile && (
                            <div className="ProfileActions">
                                <button 
                                    className={`FollowButton ${isFollowing ? 'following' : ''}`}
                                    onClick={handleFollowToggle}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserMinus size={20} />
                                            <span>언팔로우</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={20} />
                                            <span>팔로우</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ProfileStats">
                        <div className="StatItem">
                            <FileText size={20} />
                            <span className="StatNumber">{stats.postsCount}</span>
                            <span className="StatLabel">게시글</span>
                        </div>
                        <div className="StatItem">
                            <MessageCircle size={20} />
                            <span className="StatNumber">{stats.commentsCount}</span>
                            <span className="StatLabel">댓글</span>
                        </div>
                        <div className="StatItem" onClick={() => setActiveTab('followers')}>
                            <Users size={20} />
                            <span className="StatNumber">{stats.followersCount}</span>
                            <span className="StatLabel">팔로워</span>
                        </div>
                        <div className="StatItem" onClick={() => setActiveTab('following')}>
                            <Heart size={20} />
                            <span className="StatNumber">{stats.followingCount}</span>
                            <span className="StatLabel">팔로잉</span>
                        </div>
                    </div>
                </div>

                {/* 사용자 검색 섹션 */}
                <div className="SearchSection">
                    <div className="SearchContainer">
                        <div className="SearchInputWrapper">
                            <Search size={20} className="SearchIcon" />
                            <input
                                type="text"
                                placeholder="사용자를 검색하세요... (2자 이상)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="SearchInput"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="ClearButton">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        {isSearching && (
                            <div className="SearchLoading">
                                <Settings size={16} className="LoadingIcon" />
                                <span>검색 중...</span>
                            </div>
                        )}
                        
                        {showSearchResults && (
                            <div className="SearchResults">
                                {searchResults.length > 0 ? (
                                    <div className="SearchResultsList">
                                        {searchResults.map(user => (
                                            <div 
                                                key={user.id} 
                                                className="SearchResultItem"
                                                onClick={() => handleSearchResultClick(user.id)}
                                            >
                                                <div className="SearchResultAvatar">
                                                    <User size={24} />
                                                </div>
                                                <div className="SearchResultInfo">
                                                    <span className="SearchResultName">{user.username}</span>
                                                    <span className="SearchResultEmail">{user.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="NoSearchResults">
                                        <Search size={32} />
                                        <p>검색 결과가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ProfileTabs">
                    <button 
                        className={`TabButton ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FileText size={18} />
                        <span>게시글</span>
                    </button>
                    <button 
                        className={`TabButton ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        <MessageCircle size={18} />
                        <span>댓글</span>
                    </button>
                    <button 
                        className={`TabButton ${activeTab === 'followers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('followers')}
                    >
                        <Users size={18} />
                        <span>팔로워</span>
                    </button>
                    <button 
                        className={`TabButton ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => setActiveTab('following')}
                    >
                        <Heart size={18} />
                        <span>팔로잉</span>
                    </button>
                </div>

                <div className="ProfileContent">
                    {activeTab === 'posts' && (
                        <div className="PostsList">
                            {userPosts.length > 0 ? (
                                userPosts.map(post => (
                                    <div 
                                        key={post.id} 
                                        className="PostItem"
                                        onClick={() => handlePostClick(post)}
                                    >
                                        <div className="PostHeader">
                                            <span className="PostCategory">{post.category}</span>
                                            <span className="PostDate">
                                                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                        <h4 className="PostTitle">{post.title}</h4>
                                        <p className="PostPreview">
                                            {post.content.length > 100 ? 
                                                post.content.substring(0, 100) + '...' : 
                                                post.content
                                            }
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="EmptyState">
                                    <FileText size={48} />
                                    <p>작성한 게시글이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="CommentsList">
                            {userComments.length > 0 ? (
                                userComments.map(comment => (
                                    <div 
                                        key={comment.id} 
                                        className="CommentItem"
                                        onClick={() => handleCommentClick(comment)}
                                    >
                                        <div className="CommentHeader">
                                            <span className="CommentDate">
                                                {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                        <p className="CommentContent">{comment.content}</p>
                                        <div className="CommentPostInfo">
                                            게시글: {comment.postTitle}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="EmptyState">
                                    <MessageCircle size={48} />
                                    <p>작성한 댓글이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'followers' && (
                        <div className="UsersList">
                            {followers.length > 0 ? (
                                followers.map(follower => (
                                    <div 
                                        key={follower.id} 
                                        className="UserItem"
                                        onClick={() => handleUserProfileClick(follower.id)}
                                    >
                                        <div className="UserAvatar">
                                            <User size={32} />
                                        </div>
                                        <div className="UserInfo">
                                            <span className="UserName">{follower.username}</span>
                                            <span className="UserEmail">{follower.email}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="EmptyState">
                                    <Users size={48} />
                                    <p>팔로워가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <div className="UsersList">
                            {following.length > 0 ? (
                                following.map(followedUser => (
                                    <div 
                                        key={followedUser.id} 
                                        className="UserItem"
                                        onClick={() => handleUserProfileClick(followedUser.id)}
                                    >
                                        <div className="UserAvatar">
                                            <User size={32} />
                                        </div>
                                        <div className="UserInfo">
                                            <span className="UserName">{followedUser.username}</span>
                                            <span className="UserEmail">{followedUser.email}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="EmptyState">
                                    <Heart size={48} />
                                    <p>팔로잉한 사용자가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Mypage;