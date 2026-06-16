class ApiResponse {
    constructor(message = 'Success', statusCode, data = null){
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
        this.success = statusCode < 400;
    }
}

export default ApiResponse;