import app from './app';
import { env } from './config/env';

const startServer = () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
