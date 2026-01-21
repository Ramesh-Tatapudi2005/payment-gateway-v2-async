const Docs = () => (
    <div data-test-id="api-docs">
        <h2>Integration Guide</h2>
        <section data-test-id="section-sdk-integration">
            <h3>SDK Integration</h3>
            <pre data-test-id="code-snippet-sdk">
                {`<script src="http://localhost:3003/checkout.js"></script>
<script>
  const checkout = new PaymentGateway({
    orderId: 'order_123',
    onSuccess: (res) => console.log(res)
  });
  checkout.open();
</script>`}
            </pre>
        </section>
    </div>
);