import { render, screen, waitFor } from '@testing-library/react';
import InterviewPreparationModal from './InterviewPreparationModal';

test('explains when evidence-grounded preparation questions are unavailable', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ questions: [] }),
  });

  render(<InterviewPreparationModal isOpen onClose={jest.fn()} postId={1} candidateId={2} />);

  expect(screen.getByRole('dialog', { name: '면접 예상질문' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/생성된 질문이 없습니다/)).toBeInTheDocument());
  expect(screen.getByRole('button', { name: '다시 생성하기' })).toBeInTheDocument();

  global.fetch = originalFetch;
});
