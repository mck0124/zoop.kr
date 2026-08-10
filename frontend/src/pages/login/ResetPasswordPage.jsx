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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleReset = async (e) => {
    e.preventDefault();
    if (!passwordsMatch || isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      await axios.post(apiUrl('/api/candidate/reset-password'), {
        token,
        newPassword,
      });
      setResult('success');
    } catch (err) {
      setResult('fail');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-green-700">Reset your password</h2>

          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="password"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
            <input
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            {confirmPassword && (
              <p className={`text-sm font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
              </p>
            )}

            <button
              type="submit"
              disabled={!passwordsMatch || isSubmitting}
              className={`w-full text-white font-bold py-3 rounded-2xl transition ${
                passwordsMatch ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 opacity-60 cursor-not-allowed'
              }`}
              >
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>

          {result === 'success' && (
            <p role="status" className="mt-6 text-green-700 font-semibold text-center">
              Password updated successfully.
            </p>
          )}
          {result === 'fail' && (
            <p role="alert" className="mt-6 text-red-600 font-semibold text-center">
              We could not update your password. The reset link may have expired.
            </p>
          )}


          <div className="mt-3 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Back to sign in
            </Link>
          </div>

        </div>
      </div>

    </>
  );
}
