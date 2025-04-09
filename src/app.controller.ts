import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FX Trading App API</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 800px;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            p {
              font-size: 1.2rem;
              margin-bottom: 2rem;
              line-height: 1.6;
            }
            .docs-link {
              display: inline-block;
              padding: 1rem 2rem;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              transition: background-color 0.3s ease;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .docs-link:hover {
              background-color: #45a049;
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to FX Trading App API</h1>
            <p>
              Explore our comprehensive foreign exchange trading API. 
              Built with NestJS, featuring real-time rates, secure authentication, 
              and seamless transaction handling.
            </p>
            <a href="https://documenter.getpostman.com/view/19965916/2sB2cVgNZ5" 
               class="docs-link" 
               target="_blank">
              View API Documentation
            </a>
          </div>
        </body>
      </html>
    `;
  }
}