export const cashfree = Cashfree({
    mode: "sandbox", 
});

export async function handlePremiumCheckout(buttonElement) {
  try {
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = "⏳ Loading...";
    buttonElement.disabled = true;

   
    const response = await axios.post(
      "/api/v1/payment",
      {},
      {
        withCredentials: true,
      },
    );

    const paymentSessionId = response.data.data.order.payment_session_id;

    
    let checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_self",
    };

    await cashfree.checkout(checkoutOptions);
  } catch (error) {
    console.error("Could not initiate checkout:", error);
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
    alert("Payment initialization failed.");
  }
}