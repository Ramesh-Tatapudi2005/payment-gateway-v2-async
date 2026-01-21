import React from 'react';

const Failure = ({ onRetry, errorMessage }) => {
  const handleCancel = () => {
    if (window.opener) {
      window.opener.location.reload();
      window.close(); // Closes the current payment tab
    } else {
      window.location.href = 'http://localhost:3000/dashboard';
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', fontFamily: 'sans-serif' }} data-test-id="error-state">
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
      <h2 style={{ color: '#dc2626' }}>Payment Failed</h2>
      <p data-test-id="error-message" style={{ color: '#6b7280' }}>{errorMessage || "Payment could not be processed"}</p>
      <button 
        data-test-id="retry-button" 
        onClick={onRetry} 
        style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
      >
        Try Again
      </button>
      <button 
        onClick={handleCancel}
        style={{ width: '100%', padding: '14px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Cancel & Return
      </button>
    </div>
  );
};

export default Failure;