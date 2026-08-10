import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import SEO from '../../components/SEO';
import { apiUrl } from '../../api/config';

const authenticatedFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
    ...(options.headers || {}),
  },
});

// PDF.js 워커 경로 설정 (필수)
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

export default function ResponderList() {
  const { postId } = useParams();
  const [responder, setResponder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef(null);  // PDF 렌더러 참조
  const modalRef = useRef(null);      // 모달 컨테이너 참조

  // 모달 열릴 때와 리사이즈 시 컨테이너 너비 갱신
  useEffect(() => {
    if (!isModalOpen) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', updateWidth);
    updateWidth();
    return () => window.removeEventListener('resize', updateWidth);
  }, [isModalOpen]);

  // 회신자 목록 로드
  useEffect(() => {
    authenticatedFetch(apiUrl(`/api/progress/${postId}`))
      .then(res => res.json())
      .then(setResponder)
      .catch(err => console.error('❌ 후보자 목록 오류:', err));
  }, [postId]);

  const handleDetail = (r) => {
    setSelectedResponder(r);
    setModalOpen(true);
    setCurrentIdx(0);
    setNumPages(null);
    // 모달 전체 스크롤 초기화
    if (modalRef.current) modalRef.current.scrollTop = 0;
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedResponder(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // 페이지 이동 시 스크롤 유지 대신 모달 스크롤 고정
  const prev = () => setCurrentIdx(idx => idx === 0 ? numPages - 1 : idx - 1);
  const next = () => setCurrentIdx(idx => idx === numPages - 1 ? 0 : idx + 1);

  const getPdfUrl = () => {
    const filename = selectedResponder?.filePath?.split('/').pop();
    return filename ? apiUrl(`/api/files/download/${filename}`) : null;
  };

  return (
    <div>
      <Navbar />
      <SEO
        title={`Responders for job ${postId}`}
        description={`Review candidates who responded to job ${postId}.`}
        keywords={`job ${postId}, responders, hiring`}
      />
      <div className="px-12 pt-28 pb-12 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
        <h2 className="text-3xl font-bold text-emerald-800 mb-10 border-b pb-2">
          🔍 Responders for job {postId}
        </h2>
        {responder.length === 0 ? (
          <p>No responders yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {responder.map((r, i) => (
              <li
                key={i}
                className="bg-white border border-emerald-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-6 relative"
              >
                <div className="absolute top-2 right-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded">
                  #{i + 1}
                </div>
                <div className="mb-2 text-emerald-700 font-semibold text-lg">{r.name}</div>
                <div className="text-sm text-gray-700">
                  <p><strong>Email:</strong> {r.email}</p>
                  <p><strong>Location:</strong> {r.location}</p>
                  <p><strong>Languages:</strong> {r.languages}</p>
                  <p><strong>Score:</strong> {r.score}</p>
                </div>
                <div className="text-sm mt-2 italic text-gray-600 line-clamp-3">
                  {r.portfolioAnalysis}
                </div>
                <button
                  type="button"
                  onClick={() => handleDetail(r)}
                  className="mt-4 w-full py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
                >
                  View details
                </button>
              </li>
            ))}
          </ul>

        )}
        {isModalOpen && selectedResponder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
            <div
              ref={modalRef}
              className="bg-emerald-50 p-10 rounded-2xl shadow-lg border border-emerald-300 w-[80%] max-w-[1100px] max-h-[80%] relative overflow-y-auto border border-gray-300"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <h3 className="text-2xl font-bold text-emerald-700 mb-6 border-b pb-3">Responder details</h3>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-10 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">Name</span>
                  <span className="text-emerald-800 font-semibold">{selectedResponder.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="text-gray-800">{selectedResponder.email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">Location</span>
                  <span className="text-gray-800">{selectedResponder.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">Languages</span>
                  <span className="text-gray-800">{selectedResponder.languages}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">Score</span>
                  <span className="text-green-700 font-semibold">{selectedResponder.score}</span>
                </div>
                <div className="flex items-start gap-4 col-span-2">
                  <span className="text-gray-500 font-medium">Analysis</span>
                  <span className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedResponder.portfolioAnalysis}</span>
                </div>
              </div>




              {/* PDF Preview */}
              <h4 className="text-lg font-semibold text-emerald-700 mb-3">📎 Portfolio preview</h4>
              <div className="relative w-full h-full border border-gray-200 rounded-md overflow-hidden shadow-inner bg-gray-50">
                {/* Zoom Buttons */}
                <div className="absolute top-4 right-4 z-20 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
                    className="bg-white border border-gray-300 px-2 rounded hover:bg-gray-100"
                  >＋</button>
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}
                    className="bg-white border border-gray-300 px-2 rounded hover:bg-gray-100"
                  >－</button>
                </div>

                {/* Prev/Next */}
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 z-10 hover:bg-gray-600 rounded"
                >‹</button>
                <div ref={containerRef} className="w-full h-full flex justify-center items-center overflow-auto">
                  {getPdfUrl() && (
                    <Document
                      file={{
                        url: getPdfUrl(),
                        httpHeaders: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                      }}
                      onLoadSuccess={onDocumentLoadSuccess}
                    >
                      <Page
                        pageNumber={currentIdx + 1}
                        width={containerWidth * zoom}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                      />
                    </Document>
                  )}
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 z-10 hover:bg-gray-600 rounded"
                >›</button>
              </div>

              {/* Close button */}
              <div className="mt-8 text-right">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
