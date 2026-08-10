import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../api/config';
import Navbar from '../../components/Navbar';

export default function FindPasswordPage() {
  const [githubLogin, setGithubLogin] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // ✅ 전송중 상태

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // 시작 시 로딩 ON
    try {
      await axios.post(apiUrl('/api/candidate/request-password-reset'), {
        githubLogin,
        email,
        candidateName: name,
        candidatePhoneNumber: phoneNumber,
      });
      setSent(true);
      setError('');
    } catch (err) {
      setSent(false);
      setError('No account matched the information you entered.');
    } finally {
      setLoading(false); // 완료 후 로딩 OFF
    }
  };

  return (

    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-green-700">Reset your password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username"
              value={githubLogin}
              onChange={(e) => setGithubLogin(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="text"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-3 rounded-2xl transition ${
                loading
                  ? 'bg-green-600 opacity-60 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    ></path>
                  </svg>
                  Sending reset link...
                </div>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>


          {sent && (
            <p className="mt-6 text-green-700 font-semibold text-center">
              A password reset link was sent to your email.
            </p>
          )}

          {error && (
            <p className="mt-6 text-red-600 font-semibold text-center">{error}</p>
          )}

          {/* <div className="mt-3 text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:underline"
            >
            홈으로
            </Link>
          </div> */}
        </div>
      </div>

    </>
  );
}
