import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { apiUrl } from '../../api/config';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [result, setResult] = useState(null); // 'success' | 'fail'

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleReset = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) return;

    try {
      await axios.post(apiUrl('/api/candidate/reset-password'), {
        token,
        newPassword,
      });
      setResult('success');
      alert("비밀번호 변경 완료!");
    } catch (err) {
      setResult('fail');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-green-700">비밀번호 재설정</h2>

          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            {confirmPassword && (
              <p className={`text-sm font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
              </p>
            )}

            <button
              type="submit"
              disabled={!passwordsMatch}
              className={`w-full text-white font-bold py-3 rounded-2xl transition ${
                passwordsMatch ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 opacity-60 cursor-not-allowed'
              }`}
            >
              비밀번호 변경하기
            </button>
          </form>

          {result === 'success' && (
            <p className="mt-6 text-green-700 font-semibold text-center">
              비밀번호가 성공적으로 변경되었습니다.
            </p>
          )}
          {result === 'fail' && (
            <p className="mt-6 text-red-600 font-semibold text-center">
              비밀번호 변경에 실패했습니다. 토큰이 만료되었을 수 있습니다.
            </p>
          )}


          <div className="mt-3 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-blue-600 hover:underline"
            >
              로그인하러 가기
            </Link>
          </div>

        </div>
      </div>

    </>
  );
}
