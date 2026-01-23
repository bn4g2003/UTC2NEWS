import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Admission Management System API')
    .setDescription('API documentation for the Admission Management System - a comprehensive platform for managing student admissions with role-based access control, Excel data import, virtual filtering algorithms, and automated result notifications.')
    .setVersion('1.0')
    .addTag('Authentication', 'JWT-based authentication endpoints')
    .addTag('RBAC', 'Role-Based Access Control management')
    .addTag('CMS', 'Content Management System for posts, categories, and FAQs')
    .addTag('Programs', 'Major and admission session management')
    .addTag('Import', 'Student data import from Excel files')
    .addTag('Students', 'Manual student data entry and management')
    .addTag('Filter', 'Virtual filtering algorithm for admission processing')
    .addTag('Results', 'Admission result export')
    .addTag('Email', 'Email notification management')
    .addTag('Configuration', 'System configuration settings')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Admission Management System API',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
