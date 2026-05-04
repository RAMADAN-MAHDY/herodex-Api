# HeroDex API - دليل تكامل الشحن والطلبات (النسخة النهائية)

هذا هو الدليل المعتمد والوحيد لعملية الربط مع نظام الشحن والطلبات الجديد.

---

## 1. جلب قائمة المحافظات (Shipping Rates)
يجب جلب هذه القائمة أولاً لعرض المحافظات للمستخدم والحصول على الـ `_id` الخاص بالمحافظة المختارة.

- **المسار:** `GET /api/shippingrates/public`
- **الرد (Response):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67c7a5266858e3881b212f71",
      "governorate": "القاهرة",
      "cost": 70,
      "time": "24 ل 48 ساعة"
    }
  ]
}
```

---

## 2. إتمام الطلب (Checkout)
يتم إرسال بيانات الشحن وطريقة الدفع. **ملحوظة:** لا يتم إرسال المنتجات (items) لأن السيرفر يجلبها من السلة تلقائياً.

- **المسار:** `POST /api/orders/checkout`
- **شكل الـ Request Body (مطابق للـ Validator):**
```json
{
  "shippingAddress": {
    "address": "123 شارع النصر، الدور الرابع",
    "detailedAddress": "بجوار مسجد النور", // اختياري
    "city": "القاهرة",
    "governorateId": "67c7a5266858e3881b212f71", // الـ ID المستلم من API الشحن
    "postalCode": "12345",
    "phone": "01012345678",
    "email": "user@example.com" // اختياري
  },
  "paymentMethod": "COD", // الخيارات: COD, card, wallet
  "walletNumber": "01012345678", // مطلوب فقط إذا كان الدفع wallet
  "guestName": "Ramadan" // مطلوب فقط إذا كان المستخدم غير مسجل دخول
}
```

- **شكل الـ Response (الرد الناجح):**
```json
{
  "success": true,
  "message": "Order placed successfully (Cash on Delivery)",
  "data": {
    "orderId": "65e8a8...",
    "totalPrice": 1270, // السعر الإجمالي شامل الشحن
    "shippingCost": 70, // تكلفة الشحن المحسوبة
    "deliveryTime": "24 ل 48 ساعة",
    "paymentUrl": "..." // يظهر فقط في حالة الدفع الإلكتروني
  }
}
```


---

## 3. لوحة التحكم - إدارة الشحن (Admin Dashboard)

هذه العمليات تتطلب صلاحيات المسؤول (`Admin Token`).

### **أ. جلب كل بيانات الشحن (Admin List)**
- **المسار:** `GET /api/shippingrates`
- **الاستجابة:** ترجع قائمة كاملة بجميع المحافظات وتكاليفها.

### **ب. إضافة محافظة جديدة (Add New Rate)**
- **المسار:** `POST /api/shippingrates`
- **الجسم (Request Body):**
```json
{
  "governorate": "مطروح",
  "cost": 130,
  "time": "5 أيام عمل"
}
```

### **ج. تعديل بيانات محافظة (Update Rate)**
- **المسار:** `PUT /api/shippingrates/:id`
- **الجسم (Request Body):** يمكنك إرسال حقل واحد فقط أو كل الحقول.
```json
{
  "cost": 140
}
```

### **د. حذف محافظة (Delete Rate)**
- **المسار:** `DELETE /api/shippingrates/:id`

---

**ملاحظة عامة:** جميع عمليات المسؤول تتطلب إرسال الـ `Authorization: Bearer <ADMIN_TOKEN>` في الـ Headers.
