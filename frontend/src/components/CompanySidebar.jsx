import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { apiUrl } from '../api/config';

export default function CompanySidebar() {
  const [posts, setPosts] = useState([]);
  const [showOngoing, setShowOngoing] = useState(() => {
    const saved = sessionStorage.getItem('showOngoing');
    return saved === 'true';
  });
  const [activeSection, setActiveSection] = useState(() => {
    return sessionStorage.getItem('activeSection') || 'dashboard';
  });

  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!authState.userId) return;
        const res = await axios.get(apiUrl(`/api/posts/company/${authState.userId}`));
        setPosts(res.data);
      } catch (err) {
        console.error('Could not load job postings:', err);
      }
    };
    fetchPosts();
  }, [authState.userId]);

  const toggleShowOngoing = () => {
    const newValue = !showOngoing;
    setShowOngoing(newValue);
    sessionStorage.setItem('showOngoing', String(newValue));
  };

  const handleSelectSection = (sectionName, path) => {
    setActiveSection(sectionName);
    sessionStorage.setItem('activeSection', sectionName);
    navigate(path);
  };

  const ongoingPosts = posts.filter((post) => post.postStatus === 'OPEN' || post.postStatus === 'draft');

  const sectionClass = (section) =>
    `cursor-pointer font-medium rounded-md px-3 py-2 transition-all text-base
    ${activeSection === section
        ? 'bg-emerald-100 text-emerald-700 shadow-inner border-l-4 border-emerald-400'
        : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-100'}`;
  

  return (
    <aside className="sticky top-24 mt-20 ml-12 w-72 p-8 bg-white rounded-xl shadow transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg text-sm">
      <h3 className="text-base font-bold text-gray-900 mb-6">📢 Hiring workspace</h3>

      {/* 대시보드 */}
      <div className="mb-5">
        <div
          className={sectionClass('dashboard')}
          onClick={() => handleSelectSection('dashboard', '/company/dashboard')}
        >
          🧭 Dashboard
        </div>
      </div>

      {/* 채용중인 공고 */}
      <div className="mb-5">
        <div
          className={sectionClass('ongoing')}
          onClick={() => {
            toggleShowOngoing();
            setActiveSection('ongoing');
            sessionStorage.setItem('activeSection', 'ongoing');
          }}
        >
          📂 Open roles
        </div>

        {showOngoing && (
          <div className="bg-gray-50 border rounded-lg mt-2 px-4 py-3 shadow-sm text-gray-700 text-base">
            <ul className="pl-3 space-y-2">
              {ongoingPosts.map((post) => (
                <li
                  key={post.postId}
                  className="cursor-pointer hover:text-emerald-600 hover:underline transition"
                  onClick={() => navigate(`/company/state/${post.postId}`)}
                >
                  {post.postTitle}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 지난 공고 */}
      <div className="mb-5">
        <div
          className={sectionClass('archive')}
          onClick={() => handleSelectSection('archive', '/company/dashboard')}
        >
          🗂 Archived roles
        </div>
      </div>


      {/* ✅ 새 공고 추가 */}
      <button
        onClick={() => navigate('/company/recruit/create')}
        className="w-full mt-8 bg-emerald-500 text-white text-base font-semibold py-2.5 px-4 rounded-full hover:bg-emerald-600 transition"
      >
        ➕ Create a role
      </button>
    </aside>
  );
}
