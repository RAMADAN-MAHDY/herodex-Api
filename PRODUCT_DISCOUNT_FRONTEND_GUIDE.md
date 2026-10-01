# Product Discount Price: Frontend Integration

This document describes the optional product price-before-discount field. It is separate from the shipping and orders integration guide.

## Field Contract

- `price`: required current selling price.
- `originalPrice`: optional price before discount. Send it only when the product has a discount.
- When `originalPrice` is absent, the product has no displayed discount. Existing products may not contain this field.
- When `originalPrice` is present, it must be greater than `price` and no greater than `1000000`.
- Use `originalPrice` as the field name in requests and responses; do not send `oldPrice`, `discountPrice`, or a calculated discount percentage.

Example product with a discount:

```json
{
  "_id": "665a12345678901234567890",
  "name": "Product name",
  "price": 800,
  "originalPrice": 1000
}
```

The frontend can calculate and display the discount percentage as needed. The API stores only the two prices.

## Create Product

- **Method:** `POST /api/products`
- **Access:** Admin token required.
- **Content type:** `multipart/form-data` because a product image is required.
- Required fields: `name`, `price`, `description`, `category`, and `image`.
- Optional field: `originalPrice`.

Example `FormData`:

```javascript
const formData = new FormData();
formData.append('name', 'Product name');
formData.append('price', '800');
formData.append('originalPrice', '1000'); // Omit when there is no discount.
formData.append('description', 'Product description');
formData.append('category', categoryId);
formData.append('image', imageFile);
```

## Update Product

- **Method:** `PUT /api/products/:id`
- **Access:** Admin token required.
- Send only the fields being changed. The image is optional during update.
- Send a numeric `originalPrice` to add or change the before-discount price.
- Send `originalPrice` as `null` (JSON) or an empty string (multipart form) to remove it.
- Omit `originalPrice` to leave its current value unchanged.

Example request to change the price and add a discount price:

```json
{
  "price": 800,
  "originalPrice": 1000
}
```

Example request to remove the discount price:

```json
{
  "originalPrice": null
}
```

## Product Responses

Product create, update, details, and list responses include `originalPrice` when it is set. For existing products without a before-discount price, the property may be omitted; treat a missing value as no discount and do not display a crossed-out price.

For a product with a discount, display `price` as the amount to pay and `originalPrice` as the crossed-out previous price. Do not treat `originalPrice` as the active selling price.

## Validation Errors

The API returns HTTP `400` if `originalPrice` is invalid, including when it is less than or equal to the current `price`. The frontend should validate this relationship before submitting and display the API validation message if the server rejects the request.