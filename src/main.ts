import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Enable CORS
  app.enableCors();

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (isProduction) {
    app.useLogger(['error', 'warn']); 
    console.log = () => {}; // Disable console.log in production
  }
  // Test database connection
  try {
    const connection = app.get(DataSource);
    if (connection.isInitialized) {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  // Test Redis connection
  const cacheManager = app.get(CACHE_MANAGER);
  try {
    await cacheManager.set('test', 'test');
    console.log('✅ Redis connection successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FX Trading App')
    .setDescription('API documentation for FX trading system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);


  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM - Graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT - Graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  // Set port based on environment
  const port = isProduction ? (process.env.PORT || 6000) : (process.env.PORT || 5000);
  await app.listen(port);
  console.log(`Application running in ${isProduction ? 'production' : 'development'} mode on port ${port}`);
}
bootstrap();
