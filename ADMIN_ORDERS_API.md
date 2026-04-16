# Admin Orders API Documentation

This endpoint is designed for the Admin Dashboard to fetch and manage all user orders with support for searching and pagination.

## Endpoint Details
- **URL:** `/api/orders`
- **Method:** `GET`
- **Authentication:** Required (Bearer Token)
- **Authorization:** Admin Role Only

## Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `Number` | `1` | The page number to fetch. |
| `limit` | `Number` | `10` | Number of orders per page. |
| `search` | `String` | `null` | Search query for customer name, email, or phone number. |

---

## Usage Example (Axios)

```javascript
import axios from 'axios';

const fetchOrders = async (page = 1, limit = 10, search = '') => {
  try {
    const token = localStorage.getItem('token'); // Your admin token
    const response = await axios.get(`${process.env.BACKEND_URL}/api/orders`, {
      params: { page, limit, search },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Orders:', response.data.data.orders);
    console.log('Total Pages:', response.data.data.pages);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data?.message || error.message);
  }
};
```

---

## Response Structure

The API returns a standardized response object. Using `.lean()` ensures the items are lightweight JS objects.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Orders fetched",
  "data": {
    "orders": [
      {
        "_id": "661e8c...",
        "user": {
          "_id": "661e7a...",
          "name": "Ahmed Mohamed",
          "email": "ahmed@example.com"
        },
        "items": [
          {
            "product": "661e5b...",
            "name": "JavaScript Clean Code",
            "price": 250,
            "quantity": 1,
            "image": "https://i.ibb.co/..."
          }
        ],
        "shippingAddress": {
          "address": "123 Nile St",
          "city": "Cairo",
          "postalCode": "12345",
          "country": "Egypt",
          "phone": "01012345678"
        },
        "totalPrice": 250,
        "paymentMethod": "wallet",
        "paymentStatus": "paid",
        "paymobOrderId": "12345678",
        "paymobTransactionId": "987654321",
        "createdAt": "2024-04-16T15:30:00.000Z",
        "updatedAt": "2024-04-16T15:35:00.000Z"
      }
    ],
    "page": 1,
    "pages": 5,
    "totalItems": 48
  }
}
```

### Detailed Field Explanation
- **`user`**: Populated object containing the customer's basic details.
- **`items`**: Array of products purchased, including a snapshot of the price and name at the time of purchase.
- **`shippingAddress.phone`**: The direct phone number provided during checkout (Searchable).
- **`paymentStatus`**: Can be `pending`, `paid`, or `failed`.
- **`totalItems`**: Total number of orders matching the query (useful for displaying total count in dashboard).
- **`pages`**: Total number of pages based on the limit provided.

### Error Response (403 Forbidden)
Returned if the user is not an Admin.
```json
{
  "success": false,
  "message": "Not authorized as an admin",
  "errors": []
}
```
