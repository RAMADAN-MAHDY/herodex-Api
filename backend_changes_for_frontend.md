# تحديثات الـ API لتكامل الواجهة الأمامية (Frontend)

توضح هذه الوثيقة التعديلات الأخيرة في الـ API، مع التركيز على البيانات التي يجب إرسالها واستقبالها من جهة الـ Frontend.

---

## 1. تغييرات طلب إتمام الشراء (`POST /api/checkout`)

تم تحديث كائن العنوان `shippingAddress` ليعتمد على معرف المحافظة (`governorateId`) لضمان دقة حساب التكاليف.

### **الحقول المطلوبة في `shippingAddress`:**
يجب على الـ Frontend إرسال البيانات التالية عند إنشاء طلب:

```json
{
  "shippingAddress": {
    "address": "شارع المعز",
    "detailedAddress": "شقة 5، الدور الثالث", // اختياري
    "city": "القاهرة",
    "governorateId": "65e8a7b0c1d2e3f4a5b6c7d8", // هام: استخدم الـ ID الخاص بالمحافظة
    "postalCode": "12345",
    "country": "Egypt",
    "phone": "010XXXXXXXX",
    "email": "user@example.com" // اختياري
  },
  "paymentMethod": "COD", // أو "wallet", "card"
  "guestName": "Ramadan Mahdy" // مطلوب في حالة عدم تسجيل الدخول
}
```

### **ماذا يحدث في الخلفية؟**
*   يتم استخدام `governorateId` لجلب **تكلفة الشحن** و **موعد التسليم** و **اسم المحافظة** من قاعدة البيانات.
*   سيتم إضافة تكلفة الشحن إلى إجمالي الطلب تلقائياً.

---

## 2. نقاط النهاية الخاصة بأسعار الشحن (Shipping Rates)

يجب على الـ Frontend جلب قائمة المحافظات أولاً للحصول على الـ `_id` الخاص بكل محافظة.

### **أ. جلب كل المحافظات (للحصول على الـ IDs)**
*   **المسار:** `GET /api/shippingrates/public`
*   **الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65e8a7b0c1d2e3f4a5b6c7d8", // هذا هو المعرف الذي يجب إرساله في الـ checkout
      "governorate": "القاهرة",
      "cost": 70,
      "time": "24 ل 48 ساعة"
    },
    {
      "_id": "65e8a7b0c1d2e3f4a5b6c7d9",
      "governorate": "الإسكندرية",
      "cost": 80,
      "time": "4 أيام عمل"
    }
  ]
}
```

### **ب. جلب تفاصيل شحن لمحافظة معينة بالـ ID**
*   **المسار:** `GET /api/shippingrates/public/:id`
*   **مثال:** `/api/shippingrates/public/65e8a7b0c1d2e3f4a5b6c7d8`

---

## 3. لوحة التحكم (Admin Panel)

العمليات التالية متاحة للمسؤولين فقط على المسار `/api/shippingrates`:
*   `GET /api/shippingrates`: جلب كل البيانات التفصيلية.
*   `POST /api/shippingrates`: إضافة محافظة جديدة.
*   `PUT /api/shippingrates/:id`: تعديل بيانات محافظة.
*   `DELETE /api/shippingrates/:id`: حذف محافظة.

---

**ملاحظة:** يفضل دائماً جلب قائمة المحافظات من المسار العام (`/public`) في بداية عملية الدفع لضمان حصول المستخدم على أحدث الأسعار والـ IDs الصحيحة.
