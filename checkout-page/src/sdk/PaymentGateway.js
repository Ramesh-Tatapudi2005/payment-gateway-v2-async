// checkout-widget/src/sdk/PaymentGateway.js
class PaymentGateway {
  constructor(options) {
    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.onClose = options.onClose || (() => {});
    
    // Bind the listener so it can be removed later
    this._messageListener = this._handleMessage.bind(this);
  }

  _handleMessage(event) {
    if (event.data.type === 'payment_success') {
      this.onSuccess(event.data.data);
      this.close();
    } else if (event.data.type === 'payment_failed') {
      this.onFailure(event.data.data);
    } else if (event.data.type === 'close_modal') {
      this.close();
    }
  }

  open() {
    const modalHtml = `
      <div id="payment-gateway-modal" data-test-id="payment-modal" 
           style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">
        <div style="position:relative;width:450px;height:600px;background:white;border-radius:12px;overflow:hidden;">
          <iframe 
            data-test-id="payment-iframe"
            src="http://localhost:3001/checkout?order_id=${this.orderId}&embedded=true"
            style="width:100%;height:100%;border:none;"
          ></iframe>
          <button 
            data-test-id="close-modal-button"
            onclick="window.PaymentGateway.instance.close()"
            style="position:absolute;top:10px;right:10px;border:none;background:none;font-size:24px;cursor:pointer;"
          >×</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    window.addEventListener('message', this._messageListener);
    window.PaymentGateway.instance = this;
  }

  close() {
    const modal = document.getElementById('payment-gateway-modal');
    if (modal) modal.remove();
    window.removeEventListener('message', this._messageListener);
    this.onClose();
  }
}

window.PaymentGateway = PaymentGateway;