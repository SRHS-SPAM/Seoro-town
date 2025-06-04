import './Boardarr.css';
import { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { Search, PenLine, AlertCircle, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Boardarr() {
    const { isLoggedIn, user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const category = location.state?.category || '재학생';
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('http://localhost:3001/api/posts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setPosts(data.posts || []);
                console.log('게시글 목록 불러오기 성공:', data.posts?.length || 0, '개');
            } else {
                console.error('게시글 불러오기 실패:', data.message);
                setError(data.message || '게시글을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('게시글 불러오기 오류:', error);
            setError('서버와의 연결에 문제가 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (post) => {
        navigate('/infoboard', { state: { post } });
    };

    const handleBackClick = () => {
        navigate('/');
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredPosts = posts.filter(post => {
        const postCategory = post.category || '재학생';
        const matchesCategory = postCategory === category;
        const matchesSearch = searchTerm === '' || 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.authorName.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    const renderAllPosts = () => {
        if (loading) {
            return (
                <div className="EmptyBoard">
                    <p>로딩 중...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>{error}</p>
                    <button onClick={fetchPosts} style={{marginTop: '10px'}}>
                        다시 시도
                    </button>
                </div>
            );
        }
        
        if (filteredPosts.length === 0) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>{searchTerm ? '검색 결과가 없습니다' : '게시글이 없습니다'}</p>
                </div>
            );
        }
        
        return (
            <div className="AllPostsList">
                {filteredPosts.reverse().map(post => (
                    <div 
                        key={post.id} 
                        className="AllPostItem"
                        onClick={() => handlePostClick(post)}
                    >
                        <div className="PostHeader">
                            <div className="PostTitle">{post.title}</div>
                            <div className="PostDate">
                                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </div>
                        </div>
                        <div className="PostInfo">
                            <span className="PostAuthor">작성자: {post.authorName}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div>
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
                    <NavLink to="/Friends" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>친구</NavLink>
                </div>
                <LoginComponent />
            </div>

            <div className="BoardArrHeader">
                <button className="BackButton" onClick={handleBackClick}>
                    <ArrowLeft size={24} />
                    <span>돌아가기</span>
                </button>
                <h2 className="BoardArrTitle">{category} 게시글 </h2>
            </div>

            <div className="SearchContainer">
                <div className="SearchBox">
                    <div className="SearchPrefix">{category} 게시글</div>
                    <div className="SearchDivider"></div>
                    <input 
                        type="text" 
                        className="SearchInput" 
                        placeholder="검색어를 입력하세요!" 
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    <button className="SearchButton">
                        <Search size={22} />
                    </button>
                </div>
            </div>
            
            <div className="BoardArrContainer">
                <div className="BoardArrContent">
                    <div className="PostCount">
                        총 {filteredPosts.length}개의 게시글
                    </div>
                    {renderAllPosts()}
                </div>
            </div>
        </div>
    );
}

export default Boardarr;