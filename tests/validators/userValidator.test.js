import { registerSchema, loginSchema } from '../../src/validators/userValidator.js';

describe('User Validator', () => {
  describe('Register Schema', () => {
    test('should validate a valid user', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      const { error } = registerSchema.validate(user);
      expect(error).toBeUndefined();
    });

    test('should fail if name is too short', () => {
      const user = { name: 'Jo', email: 'john@example.com', password: 'password123' };
      const { error } = registerSchema.validate(user);
      expect(error.details[0].message).toBe('Name should have a minimum length of 3');
    });

    test('should fail if email is invalid', () => {
      const user = { name: 'John Doe', email: 'invalid-email', password: 'password123' };
      const { error } = registerSchema.validate(user);
      expect(error.details[0].message).toBe('Please provide a valid email address');
    });
  });

  describe('Login Schema', () => {
    test('should validate a valid login', () => {
      const credentials = { email: 'john@example.com', password: 'password123' };
      const { error } = loginSchema.validate(credentials);
      expect(error).toBeUndefined();
    });

    test('should fail if password is missing', () => {
      const credentials = { email: 'john@example.com' };
      const { error } = loginSchema.validate(credentials);
      expect(error.details[0].message).toBe('Password is a required field');
    });
  });
});
