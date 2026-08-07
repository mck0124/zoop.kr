import React, { useState } from 'react';
import CandidateModal from './CandidateModal';
import { apiUrl } from '../api/config';

const CandidateModalWrapper = ({ children, postId, fromMatchingTab }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleDetail = async (candidate) => {
    console.log("상세보기 :", candidate);
    setSelectedCandidate(candidate);
    setModalOpen(true);

    // job_cand_curr_stage가 특정 값인 경우에만 파일 경로 요청
    const stagesNeedingFile = ['2y', '3n', '3y', '4n', '4y'];
    if (stagesNeedingFile.includes(candidate.jobCandCurrStage)) {
      try {
        const res = await fetch(apiUrl(`/api/portfolios/${candidate.jobCandidateId}/file-path`));
        if (!res.ok) throw new Error("포트폴리오 경로 요청 실패");
        const data = await res.json();
        const filePath = data.filePath;
        console.log("filePath : ", filePath);
        setSelectedCandidate((prev) => ({ ...prev, filePath }));
      } catch (err) {
        console.error("파일 경로 불러오기 오류:", err);
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
  };

  return (
    <>
      {children({ handleDetail })}
      
      {isModalOpen && selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={closeModal}
          postId={postId}
          fromMatchingTab={fromMatchingTab}
        />
      )}
    </>
  );
};

export default CandidateModalWrapper;
