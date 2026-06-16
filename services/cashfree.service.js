import { Cashfree, CFEnvironment } from "cashfree-pg"; 

const cashfree = new Cashfree(CFEnvironment.SANDBOX, process.env.API_KEY, process.env.SECRET_KEY);

export {
    cashfree
}

