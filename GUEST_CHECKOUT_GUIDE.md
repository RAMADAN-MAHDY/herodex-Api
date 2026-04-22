# دليل التعامل مع نظام الضيوف (Guest Checkout) للفرونت اند

تم تحديث النظام ليدعم عمليات السلة والشراء للمستخدمين غير المسجلين (Guests). إليك التفاصيل التقنية للتعامل مع هذه التغييرات.

## 1. الفكرة الأساسية
النظام الآن يعتمد على معرف فريد للضيف يسمى `guestId`.
- إذا كان المستخدم مسجلاً: يتم استخدام الـ `token` كالمعتاد.
- إذا كان المستخدم غير مسجل: يتم استخدام الـ `guestId`.

## 2. كيفية الحصول على `guestId` وتخزينه
عند إرسال أي طلب لمسارات السلة أو الطلبات بدون Token، سيقوم السيرفر بإنشاء `guestId` وإرجاعه في الترويسات (Headers).

**يجب على الفرونت اند:**
1. التحقق من وجود الترويسة `x-guest-id` في الاستجابة.
2. تخزين هذا المعرف في الـ `localStorage` أو `Cookies`.
3. إرساله في جميع الطلبات القادمة في الترويسة `x-guest-id`.

---

## 3. مثال باستخدام Axios

### إعداد الـ Interceptor لإدارة الـ guestId تلقائياً
يفضل استخدام interceptors لإرسال واستقبال المعرف بشكل آلي:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-api-url.com/api'
});

// إرسال الـ guestId مع كل طلب إذا كان موجوداً
api.interceptors.request.use((config) => {
  const guestId = localStorage.getItem('guestId');
  if (guestId) {
    config.headers['x-guest-id'] = guestId;
  }
  return config;
});

// استقبال وحفظ الـ guestId من السيرفر
api.interceptors.response.use((response) => {
  const newGuestId = response.headers['x-guest-id'];
  if (newGuestId) {
    localStorage.setItem('guestId', newGuestId);
  }
  return response;
});
```

### مثال لعملية Checkout لمستخدم ضيف
```javascript
const checkoutData = {
  shippingAddress: {
    address: "123 Street Name",
    city: "Cairo",
    postalCode: "12345",
    country: "Egypt",
    phone: "01012345678"
  },
  paymentMethod: "COD", 
};

api.post('/orders/checkout', checkoutData)
  .then(res => console.log('Order Created:', res.data))
  .catch(err => console.error(err));
```

---

## 4. دمج السلة عند تسجيل الدخول (Merging)
عندما يقوم المستخدم بتسجيل الدخول أو إنشاء حساب، يجب إرسال الـ `guestId` في الترويسة ليقوم السيرفر بدمج محتويات سلة الضيف مع حسابه الجديد.

```javascript
// عند تسجيل الدخول
api.post('/auth/login', { email, password }, {
  headers: {
    'x-guest-id': localStorage.getItem('guestId') // إرسال المعرف للدمج
  }
}).then(res => {
  localStorage.removeItem('guestId'); // مسحه بعد النجاح لأن السلة دمجت
  // حفظ التوكن كالمعتاد
});
```

---

## 5. شكل الاستجابة (Full Response Example)

### استجابة السلة (Cart Response)
```json
{
  "success": true,
  "message": "Cart fetched",
  "data": {
    "_id": "65f123abc...",
    "guestId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "product": {
          "_id": "65d456def...",
          "name": "كتاب برمجة",
          "price": 150,
          "image": "image_url"
        },
        "quantity": 2,
        "_id": "65f123..."
      }
    ],
    "createdAt": "2024-03-13T...",
    "updatedAt": "2024-03-13T..."
  }
}
```

### استجابة الطلب (Order Response - COD)
```json
{
  "success": true,
  "message": "Order placed successfully (Cash on Delivery)",
  "data": {
    "orderId": "65f789ghi..."
  }
}
```

---

## ملاحظات هامة
- مسار الـ Checkout أصبح متاحاً للجميع (`identifyUser` middleware).
- مسار الـ `myorders` لا يزال يتطلب تسجيل دخول (`protect` middleware).
- عند الدفع بالـ Wallet لضيف، سيستخدم السيرفر أول 5 حروف من الـ `guestId` كـ `last_name` لمتطلبات Paymob إذا لم يتوفر اسم.
