import { Cashfree, CFEnvironment } from "cashfree-pg"; 

const cashfree = new Cashfree(CFEnvironment.SANDBOX, process.env.API_KEY, process.env.SECRET_KEY);

const order_amount = 1.00;

const order_currency = 'INR';

const order_id = "devstudio_7465654500634403894";


const request = {
    order_amount,
    order_currency,
    order_id,
    customer_details: {
			customer_id: "node_sdk_test",
			customer_name: "john",
			customer_email: "example@gmail.com",
			customer_phone: "9999999999",
    },
    order_meta: {
        return_url: "http://127.0.0.1:3000/payment-status/order_id",
        payment_methods: "cc,dc,upi"
    },
    
    order_expiry_time: "2026-05-29T06:48:17.828Z",
    order_note: "Sample Order Note",
    order_tags: {
        name: "Developer",
        company: "Cashfree"
    }
};

export {
    cashfree,
    request
}

// cashfree.PGCreateOrder(request).then((response) => {
//     console.log('Order created successfully:',response.data);
// }).catch((error) => {
//     console.error('Error:', error.response.data.message);
// });