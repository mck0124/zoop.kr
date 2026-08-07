import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../api/config';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function FindIdPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null); // null | 'success' | 'fail'
  const [githubLogin, setGithubLogin] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 요청 시작 시 결과 초기화
    setResult(null);
    setGithubLogin('');
    
    try {
      const res = await axios.post(apiUrl('/api/candidates/find-id'), {
        name,
        email,
      });
      setGithubLogin(res.data.githubLogin);
      setResult('success');
    } catch (err) {
      console.log('에러 응답:', err.response?.data);
      setResult('fail');
    }
  };

  // 아이디 마스킹 처리: 앞 4글자 + ***** (고정)
  const maskGithubLogin = (login) => {
    if (!login) return '';
    return login.slice(0, 4) + '*****';
  };

  return (

    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-green-700">아이디 찾기</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition"
            >
              아이디 찾기
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-blue-600 hover:underline"
            >
              로그인하러 가기
            </Link>
          </div>

          {result === 'success' && (
            <p className="mt-6 text-center text-base font-semibold text-gray-800">
              회원님의 아이디는{' '}
              <span className="text-green-600 text-xl font-bold">
                {maskGithubLogin(githubLogin)}
              </span>{' '}
              입니다.
            </p>
          )}

          {result === 'fail' && (
            <p className="mt-6 text-red-600 font-semibold text-center">
              입력하신 정보와 일치하는 계정이 존재하지 않습니다.
            </p>
          )}
        </div>
      </div>
      <Navbar />

    </>
  );
}
