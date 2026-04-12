import { productSchema, updateProductSchema } from '../../src/validators/productValidator.js';

describe('Product Validator', () => {
  const validProduct = {
    name: 'Skin Cream',
    price: 19.99,
    description: 'A high quality skin cream for all skin types',
    category: '507f1f77bcf86cd799439011'
  };

  test('should validate a valid product', () => {
    const { error } = productSchema.validate(validProduct);
    expect(error).toBeUndefined();
  });

  test('should fail if product name is too short', () => {
    const product = { ...validProduct, name: 'S' };
    const { error } = productSchema.validate(product);
    expect(error.details[0].message).toBe('Product name should have at least 2 characters');
  });

  test('should fail if price is less than 0.01', () => {
    const product = { ...validProduct, price: 0 };
    const { error } = productSchema.validate(product);
    expect(error.details[0].message).toBe('Price must be at least 0.01');
  });

  test('should fail if category ID is invalid format', () => {
    const product = { ...validProduct, category: 'invalid-id' };
    const { error } = productSchema.validate(product);
    expect(error.details[0].message).toBe('Invalid Category ID format');
  });

  describe('Update Product Schema', () => {
    test('should validate a valid partial update', () => {
      const update = { price: 25.99 };
      const { error } = updateProductSchema.validate(update);
      expect(error).toBeUndefined();
    });

    test('should fail if update is empty', () => {
      const update = {};
      const { error } = updateProductSchema.validate(update);
      expect(error.details[0].message).toBe('At least one field must be provided for update');
    });
  });
});
