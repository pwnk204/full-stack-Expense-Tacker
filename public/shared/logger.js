const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';


const IS_DEVELOPMENT = isLocalhost; 

const logger = {
    info: (message, data = {}) => {
        if (IS_DEVELOPMENT) {
            console.log(`[INFO]: ${message}`, data);
        }
    },

    warn: (message, data = {}) => {
        if (IS_DEVELOPMENT) {
            console.warn(`[WARN]: ${message}`, data);
        }
    },

    error: (message, errorObj = {}) => {
      
        console.error(`[ERROR]: ${message}`, errorObj);

        logger.sendToBackend(message, errorObj);
    },

    
    sendToBackend: async (message, errorObj) => {
        try {
           
            await axios.post('/api/v1/frontend-logs', {
                message: message,
                
                error: errorObj.message || String(errorObj),
                stack: errorObj.stack || 'No stack trace available',
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        } catch (e) {
           
            console.error("Failed to send log to backend", e);
        }
    }
};

export default logger;