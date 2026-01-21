import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Success from './Success';
import Failure from './Failure';

const Checkout = () => {
    const [order, setOrder] = useState(null);
    const [view, setView] = useState('selection'); 
    const [paymentData, setPaymentData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [cardNetwork, setCardNetwork] = useState('unknown'); 
    
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get('order_id');
    
    // Check if the page is being loaded within an iframe via the SDK
    const isEmbedded = query.get('embedded') === 'true';

    // Helper function to send messages back to the Merchant's parent window
    const sendMessageToParent = (type, data) => {
        if (isEmbedded && window.parent) {
            window.parent.postMessage({ type, data }, '*');
        }
    };

    // 1. PUBLIC ENDPOINT: Fetch order details
    useEffect(() => {
        if (orderId) {
            axios.get(`http://localhost:8000/api/v1/orders/${orderId}/public`)
                .then(res => setOrder(res.data))
                .catch(() => setView('error'));
        }
    }, [orderId]);

    // Card detection logic
    const handleCardNumberChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.startsWith('4')) setCardNetwork('visa');
        else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(val)) setCardNetwork('mastercard');
        else if (/^3[47]/.test(val)) setCardNetwork('amex');
        else if (/^(60|65|81|82|83|84|85|86|87|88|89)/.test(val)) setCardNetwork('rupay');
        else setCardNetwork('unknown');
    };

    // 2. PUBLIC PAYMENT ENDPOINT
    const handlePayment = async (payload) => {
        setView('processing');
        try {
            const res = await axios.post('http://localhost:8000/api/v1/payments/public', 
                { order_id: orderId, ...payload }
            );
            // Polling is started using the ID returned by the async backend
            pollStatus(res.data.payment_id); 
        } catch (err) {
            const errorDesc = err.response?.data?.detail?.error?.description || "Payment failed";
            setErrorMessage(errorDesc);
            setView('error');
            
            // Notify SDK of failure
            sendMessageToParent('payment_failed', { error: errorDesc });
        }
    };

    // 3. POLLING: Detect status change from Async Workers
    const pollStatus = (id) => {
        const interval = setInterval(async () => {
            try {
                // Notice the '/public' at the end to match the new API route
                const res = await axios.get(`http://localhost:8000/api/v1/payments/${id}/public`);
                
                if (res.data.status === 'success') {
                    setPaymentData(res.data);
                    setView('success');
                    clearInterval(interval);
                    
                    // Trigger SDK success callback
                    sendMessageToParent('payment_success', { 
                        paymentId: res.data.id,
                        orderId: orderId 
                    });
                } else if (res.data.status === 'failed') {
                    const desc = res.data.error_description || "Transaction declined by bank";
                    setErrorMessage(desc);
                    setView('error');
                    clearInterval(interval);
                    
                    // Trigger SDK failure callback
                    sendMessageToParent('payment_failed', { error: desc });
                }
            } catch (err) {
                // Don't stop on 404, the record might still be enqueuing
                console.log("Waiting for status update...");
            }
        }, 2000);
    };

    const styles = {
        // Updated container to handle embedded vs standalone view
        container: { 
            maxWidth: '450px', 
            margin: isEmbedded ? '0' : '40px auto', 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: isEmbedded ? '0' : '12px', 
            boxShadow: isEmbedded ? 'none' : '0 10px 25px rgba(0,0,0,0.1)', 
            fontFamily: 'sans-serif',
            height: isEmbedded ? '100vh' : 'auto',
            boxSizing: 'border-box'
        },
        input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' },
        buttonPrimary: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
        summary: { borderBottom: '1px solid #eee', marginBottom: '20px', paddingBottom: '15px' },
        label: { display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' },
        methodBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', cursor: 'pointer', backgroundColor: 'white' },
        networkBadge: { float: 'right', fontSize: '10px', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#374151' }
    };

    if (view === 'success') return <Success paymentId={paymentData?.id} />;
    if (view === 'error') return <Failure onRetry={() => setView('selection')} errorMessage={errorMessage} />;

    return (
        <div style={styles.container} data-test-id="checkout-container">
            {view === 'processing' ? (
                <div data-test-id="processing-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <span data-test-id="processing-message" style={{ fontWeight: 'bold', display: 'block' }}>Verifying with Bank...</span>
                </div>
            ) : (
                <>
                    <div style={styles.summary} data-test-id="order-summary">
                        <h2 style={{ margin: '0 0 10px', fontSize: '20px' }}>Secure Checkout</h2>
                        <div>
                            <span>Amount: </span>
                            <strong data-test-id="order-amount">₹{(order?.amount / 100).toFixed(2)}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                            <span>Order ID: </span>
                            <span data-test-id="order-id">{orderId}</span>
                        </div>
                    </div>

                    {view === 'selection' && (
                        <div data-test-id="payment-methods">
                            <p style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '14px' }}>Choose a payment method</p>
                            <button style={styles.methodBtn} data-test-id="method-upi" onClick={() => setView('upi')}>
                                <span>UPI (Google Pay, PhonePe)</span>
                                <span>&rarr;</span>
                            </button>
                            <button style={styles.methodBtn} data-test-id="method-card" onClick={() => setView('card')}>
                                <span>Debit / Credit Card</span>
                                <span>&rarr;</span>
                            </button>
                        </div>
                    )}

                    {view === 'upi' && (
                        <form data-test-id="upi-form" onSubmit={(e) => { e.preventDefault(); handlePayment({ method: 'upi', vpa: e.target.vpa.value }); }}>
                            <button type="button" onClick={() => setView('selection')} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '15px' }}>&larr; Back</button>
                            <label style={styles.label}>Virtual Payment Address</label>
                            <input data-test-id="vpa-input" name="vpa" placeholder="username@bank" style={styles.input} required />
                            <button data-test-id="pay-button" type="submit" style={styles.buttonPrimary}>Pay Now</button>
                        </form>
                    )}

                    {view === 'card' && (
                        <form data-test-id="card-form" onSubmit={(e) => { 
                            e.preventDefault(); 
                            handlePayment({ 
                                method: 'card', 
                                card: {
                                    number: e.target.number.value,
                                    expiry_month: e.target.expiry.value.split('/')[0],
                                    expiry_year: e.target.expiry.value.split('/')[1],
                                    cvv: e.target.cvv.value,
                                    holder_name: e.target.name.value
                                }
                            }); 
                        }}>
                            <button type="button" onClick={() => setView('selection')} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '15px' }}>&larr; Back</button>
                            
                            <label style={styles.label}>
                                Card Number 
                                {cardNetwork !== 'unknown' && <span style={styles.networkBadge}>{cardNetwork.toUpperCase()}</span>}
                            </label>
                            <input data-test-id="card-number-input" name="number" placeholder="0000 0000 0000 0000" style={styles.input} required onChange={handleCardNumberChange} />
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Expiry</label>
                                    <input data-test-id="expiry-input" name="expiry" placeholder="MM/YY" style={styles.input} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>CVV</label>
                                    <input data-test-id="cvv-input" name="cvv" placeholder="123" style={styles.input} required />
                                </div>
                            </div>
                            
                            <label style={styles.label}>Cardholder Name</label>
                            <input data-test-id="cardholder-name-input" name="name" placeholder="John Doe" style={styles.input} required />
                            
                            <button data-test-id="pay-button" type="submit" style={styles.buttonPrimary}>Pay Securely</button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default Checkout;