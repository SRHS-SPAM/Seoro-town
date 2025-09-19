const getImageUrl = (path) => {
  if (!path) {
    // 이미지가 없는 경우를 위한 기본 이미지 경로
    return '/placeholder.png'; 
  }
  // 경로가 http로 시작하면 (Cloudinary URL처럼) 그대로 반환
  if (path.startsWith('http')) {
    return path;
  }
  // 그렇지 않으면 (기존 /uploads/ 경로처럼) API 서버 주소를 앞에 붙여서 반환
  return `${process.env.REACT_APP_API_URL}${path}`;
};

export default getImageUrl;
