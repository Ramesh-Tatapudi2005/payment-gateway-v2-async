import React from 'react';

const Success = ({ paymentId }) => {
  const handleFinish = () => {
    if (window.opener) {
      // 1. Tell the original tab to refresh
      try {
        window.opener.location.reload();
      } catch (e) {
        // Fallback if ports cause a security error
        window.opener.postMessage('refresh', 'http://localhost:3000');
      }
      // 2. Close this checkout tab
      window.close();
    } else {
      // Fallback if user manually opened the tab
      window.location.href = 'http://localhost:3000/dashboard';
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', fontFamily: 'sans-serif' }} data-test-id="success-state">
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
      <h2 style={{ color: '#059669' }}>Payment Successful!</h2>
      <p>Payment ID: <span data-test-id="payment-id" style={{ fontWeight: 'bold' }}>{paymentId}</span></p>
      <p data-test-id="success-message" style={{ color: '#6b7280' }}>Your payment has been processed successfully.</p>
      <button 
        onClick={handleFinish}
        style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}
      >
        Finish & Return
      </button>
    </div>
  );
};

export default Success;