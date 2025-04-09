import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();