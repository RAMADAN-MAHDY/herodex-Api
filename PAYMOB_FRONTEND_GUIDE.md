# دليل ربط Paymob للواجهة الأمامية (Frontend)

هذا الدليل يشرح كيفية ربط عملية الدفع في تطبيق الواجهة الأمامية باستخدام نقاط النهاية (Endpoints) الخاصة بـ Paymob التي تم تنفيذها في الخلفية.

## الرابط الأساسي (Base URL)
جميع طلبات API يجب أن تبدأ برابط الخلفية الخاص بك، مثال: `http://localhost:5000/api/orders`

---

## 1. بدء عملية الدفع (Initiate Checkout)
**Endpoint:** `POST /checkout`  
**التوثيق (Authentication):** مطلوب (Bearer Token)

تقوم هذه النقطة بتسجيل الطلب وإرجاع رابط الدفع `paymentUrl`.

### أ. الدفع بالبطاقة البنكية (Credit/Debit Card)
```javascript
import axios from 'axios';

const handleCardCheckout = async () => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`, // توكن المستخدم المسجل
      },
    };

    const payload = {
      paymentMethod: 'card',
      shippingAddress: {
        address: '123 اسم الشارع',
        city: 'القاهرة',
        postalCode: '12345',
        country: 'Egypt',
        phone: '010XXXXXXXX', // رقم الهاتف مطلوب
      },
    };

    const { data } = await axios.post('/api/orders/checkout', payload, config);

    // توجيه المستخدم إلى صفحة الدفع (Iframe)
    if (data.success) {
      window.location.href = data.data.paymentUrl;
    }
  } catch (error) {
    console.error('خطأ في عملية الدفع:', error.response?.data?.message || error.message);
  }
};
```

### ب. الدفع عن طريق المحفظة الإلكترونية (فودافون كاش، اتصالات كاش، إلخ)
```javascript
const handleWalletCheckout = async (walletNumber) => {
  const payload = {
    paymentMethod: 'wallet',
    walletNumber: walletNumber, // رقم المحفظة (مثل "010XXXXXXXX")
    shippingAddress: {
      address: '123 اسم الشارع',
      city: 'القاهرة',
      postalCode: '12345',
      country: 'Egypt',
      phone: '010XXXXXXXX',
    },
  };

  const { data } = await axios.post('/api/orders/checkout', payload, config);

  // توجيه المستخدم إلى رابط مقدم الخدمة
  if (data.success) {
    window.location.href = data.data.paymentUrl;
  }
};
```

### ج. الدفع عند الاستلام (Cash on Delivery - COD)
في حالة الدفع عند الاستلام، لا يتم توجيه المستخدم لـ Paymob. يتم إنشاء الطلب مباشرة وإرجاع رسالة نجاح.

```javascript
const handleCODCheckout = async () => {
  const payload = {
    paymentMethod: 'COD',
    shippingAddress: {
      address: '123 اسم الشارع',
      city: 'القاهرة',
      postalCode: '12345',
      country: 'Egypt',
      phone: '010XXXXXXXX',
    },
  };

  const { data } = await axios.post('/api/orders/checkout', payload, config);

  if (data.success) {
    // توجيه المستخدم مباشرة لصفحة النجاح الخاصة بك
    // ملاحظة: لا يوجد paymentUrl هنا
    window.location.href = '/checkout/success?order_id=' + data.data.orderId;
  }
};
```

---

## 2. معالجة الرد (Redirects)

بعد إكمال المستخدم لعملية الدفع (أو فشلها) على موقع Paymob، سيقوم النظام تلقائياً بإعادة توجيهه إلى تطبيق الواجهة الأمامية الخاص بك.

### إعادة التوجيه عند النجاح (Success Redirect)
سيوجه الباك إند المستخدم إلى:  
`YOUR_FRONTEND_URL/checkout/success?transaction_id=XXXXXX`

**ما يجب فعله:**
- عرض رسالة "شكرًا لك، تم الدفع بنجاح".
- يمكنك استخدام رقم المعاملة `transaction_id` من الرابط كمرجع للمستخدم.

### إعادة التوجيه عند الفشل (Failure Redirect)
سيوجه الباك إند المستخدم إلى:  
`YOUR_FRONTEND_URL/checkout/error`

**ما يجب فعله:**
- إبلاغ المستخدم بفشل عملية الدفع.
- اقتراح المحاولة مرة أخرى أو اختيار وسيلة دفع مختلفة.

---

## 3. سجل الطلبات (Order History)
**Endpoint:** `GET /myorders`  
**التوثيق (Authentication):** مطلوب (Bearer Token)

استخدم هذه النقطة لعرض الطلبات السابقة للمستخدم وحالاتها.

```javascript
const getMyOrders = async () => {
  const { data } = await axios.get('/api/orders/myorders', config);
  return data.data; // مصفوفة من الطلبات
};
```

### هيكل كائن الطلب (Order Object)
```json
{
  "_id": "64...",
  "totalPrice": 150.5,
  "paymentStatus": "pending", // الحالات: "paid", "pending", "failed"
  "paymentMethod": "COD", // أو "wallet" أو "card"
  "items": [
    {
      "product": "64...",
      "name": "اسم المنتج",
      "image": "رابط_الصورة",
      "price": 50.25,
      "quantity": 2
    }
  ],
  "createdAt": "2023-..."
}
```

---

## ملاحظات هامة
- **التوجيه:** استخدم دائماً `window.location.href` للانتقال إلى `paymentUrl` لأنه يوجه المستخدم لمواقع خارجية.
- **تفريغ السلة:** يقوم الباك إند تلقائياً بتفريغ سلة المشتريات من قاعدة البيانات عند **تأكيد نجاح الدفع (Card/Wallet)** أو **مباشرة بعد طلب (COD)**. يجب عليك تفريغ السلة في الحالة المحلية (Local State) عند الوصول لصفحة النجاح.
