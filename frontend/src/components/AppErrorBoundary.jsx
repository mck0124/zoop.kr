import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false, errorId: '' };

  static getDerivedStateFromError() {
    return {
      hasError: true,
      errorId: `ZOOP-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep the detailed stack in the local console for development diagnostics;
    // the UI exposes only a safe reference ID to users.
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled application error:', error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6fbfa', color: '#17352f' }}>
        <section role="alert" style={{ width: 'min(100%, 560px)', padding: 32, borderRadius: 24, background: '#fff', border: '1px solid #d9eee8', boxShadow: '0 18px 50px rgba(26, 106, 88, 0.12)', textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }} aria-hidden="true">🛟</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 24 }}>Something went wrong</h1>
          <p style={{ margin: '0 auto 20px', lineHeight: 1.7, color: '#53706a' }}>You can safely recover this screen. Try again or return to the home page.</p>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: '#8aa39d', fontFamily: 'monospace' }}>오류 ID: {this.state.errorId}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 999, padding: '11px 18px', background: '#30c59b', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
          <button type="button" onClick={() => window.location.assign('/')} style={{ border: '1px solid #b9ded4', borderRadius: 999, padding: '11px 18px', background: '#fff', color: '#237c68', fontWeight: 700, cursor: 'pointer' }}>Go home</button>
          </div>
        </section>
      </main>
    );
  }
}
