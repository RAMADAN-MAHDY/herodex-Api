import { categorySchema, updateCategorySchema } from '../../src/validators/categoryValidator.js';

describe('Category Validator', () => {
  const validCategory = {
    name: 'Skincare',
    description: 'All kinds of skincare products'
  };

  test('should validate a valid category', () => {
    const { error } = categorySchema.validate(validCategory);
    expect(error).toBeUndefined();
  });

  test('should fail if category name is too short', () => {
    const category = { ...validCategory, name: 'S' };
    const { error } = categorySchema.validate(category);
    expect(error.details[0].message).toBe('Category name should have at least 2 characters');
  });

  test('should fail if description exceeds 255 characters', () => {
    const category = { ...validCategory, description: 'a'.repeat(256) };
    const { error } = categorySchema.validate(category);
    expect(error.details[0].message).toBe('Description cannot exceed 255 characters');
  });

  describe('Update Category Schema', () => {
    test('should validate a valid update', () => {
      const update = { name: 'Makeup' };
      const { error } = updateCategorySchema.validate(update);
      expect(error).toBeUndefined();
    });

    test('should fail if update is empty', () => {
      const update = {};
      const { error } = updateCategorySchema.validate(update);
      expect(error.details[0].message).toBe('At least one field must be provided for update');
    });
  });
});
