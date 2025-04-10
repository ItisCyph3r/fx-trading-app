// filepath: src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return HTML welcome page', () => {
      const result = appController.getHello();
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('Welcome to FX Trading App API');
      expect(result).toContain('View API Documentation');
    });
  });
});