import winston from 'winston';

 const logger = winston.createLogger({
  level: 'info', // Logs 'info' and everything more severe (warn, error)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Forces logs into JSON format
  ),
  transports: [
    // 1. Print all logs to the terminal (like console.log)
    new winston.transports.Console({
      format: winston.format.simple(), // Keep it readable in the terminal
    }),
    // 2. Save ONLY errors to a dedicated file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // 3. Save ALL logs to a general file
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

export default logger

