import request from 'supertest';
import app from '../index.js';
import mongoose from 'mongoose';

describe('Security Headers', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should have HSTS header', async () => {
    const response = await request(app).get('/');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  it('should have CSP header', async () => {
    const response = await request(app).get('/');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('should have X-Frame-Options set to DENY', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should have X-Content-Type-Options set to nosniff', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should have Referrer-Policy set to no-referrer', async () => {
    const response = await request(app).get('/');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('should NOT have X-Powered-By header', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
