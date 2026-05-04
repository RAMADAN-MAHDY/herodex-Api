# تغييرات الواجهة الخلفية لتكامل الواجهة الأمامية

توضح هذه الوثيقة التعديلات الأخيرة في الواجهة الخلفية، مع التركيز على كيفية تأثيرها على تطوير الواجهة الأمامية. وتغطي التغييرات التي طرأت على النماذج ووحدات التحكم الحالية، وإدخال نماذج جديدة ونقاط نهاية API لإدارة أسعار الشحن، وهياكل الطلبات والاستجابات التفصيلية.

---

## 1. تغييرات نموذج `Order` (`src/models/Order.js`)

تم توسيع المستند الفرعي `shippingAddress` ضمن نموذج `Order` ليشمل معلومات شحن أكثر تفصيلاً وقيمًا محسوبة.

**مخطط `shippingAddress` القديم:**
```javascript
shippingAddress: {
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true }
},
```

**مخطط `shippingAddress` الجديد:**
```javascript
shippingAddress: {
  address: { type: String, required: true },
  detailedAddress: { type: String }, // جديد: اختياري، للشقة، الطابق، إلخ.
  city: { type: String, required: true },
  governorate: { type: String, required: true }, // جديد: مطلوب لحساب الشحن
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Egypt' }, // الافتراضي هو 'Egypt'
  phone: { type: String, required: true },
  email: { type: String }, // جديد: بريد إلكتروني اختياري للاتصال بالشحن
  shippingCost: { type: Number, required: true, default: 0 }, // جديد: تكلفة الشحن المحسوبة
  deliveryTime: { type: String, required: true, default: 'Within 5 business days' } // جديد: وقت التسليم المحسوب
},
```

**تأثير الواجهة الأمامية:**
*   عند إنشاء طلب، يجب على الواجهة الأمامية الآن إرسال `detailedAddress` و `governorate` و `email` (اختياري) كجزء من كائن `shippingAddress` في نص الطلب.
*   حقل `governorate` بالغ الأهمية لأنه يستخدمه الواجهة الخلفية لحساب `shippingCost` و `deliveryTime`.
*   سيتم تعيين حقل `country` افتراضيًا على "مصر" إذا لم يتم توفيره.
*   سيتم حساب `shippingCost` و `deliveryTime` تلقائيًا وتخزينهما في الطلب بواسطة الواجهة الخلفية.

---

## 2. نموذج `ShippingRate` الجديد (`src/models/ShippingRate.js`)

تم تقديم نموذج Mongoose جديد لتخزين أسعار الشحن ديناميكيًا في قاعدة البيانات.

**مخطط `ShippingRate`:**
```javascript
const shippingRateSchema = new mongoose.Schema({
  governorate: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  time: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });
```

**تأثير الواجهة الأمامية:**
*   يتم إدارة هذا النموذج بشكل أساسي بواسطة المستخدمين المسؤولين عبر نقاط نهاية API الجديدة (الموثقة أدناه).
*   يمكن للواجهة الأمامية جلب هذه الأسعار باستخدام نقطة نهاية عامة لعرض خيارات الشحن للمستخدمين.

---

## 3. تغييرات `shippingService.js` (`src/utils/shippingService.js`)

تمت إعادة هيكلة ملف `shippingService.js` لجلب أسعار الشحن من قاعدة البيانات بدلاً من استخدام القيم المكتوبة يدويًا. كما يتضمن آلية التخزين المؤقت.

**التغييرات الرئيسية:**
*   يستورد نموذج `ShippingRate`.
*   `getShippingDetails(governorate)` هي الآن دالة `async`.
*   يقوم أولاً بالتحقق من ذاكرة التخزين المؤقت المحلية لأسعار الشحن. إذا كانت ذاكرة التخزين المؤقت صالحة وتحتوي على المحافظة المطلوبة، فإنه يعيد البيانات المخزنة مؤقتًا.
*   إذا لم يكن في ذاكرة التخزين المؤقت أو انتهت صلاحية ذاكرة التخزين المؤقت، فإنه يجلب جميع أسعار الشحن من مجموعة `ShippingRate` في قاعدة البيانات، ويخزنها مؤقتًا، ثم يعيد التفاصيل للمحافظة المطلوبة.
*   يتضمن سعرًا احتياطيًا افتراضيًا إذا لم يتم العثور على المحافظة في قاعدة البيانات.

**تأثير الواجهة الأمامية:**
*   لا تتفاعل الواجهة الأمامية مباشرة مع هذه الخدمة. إنها أداة مساعدة داخلية للواجهة الخلفية.
*   ومع ذلك، تعتمد عملية `checkout` (الموثقة لاحقًا) على هذه الخدمة المحدثة للحصول على تكاليف الشحن الديناميكية.

---

## 4. تغييرات `orderController.js` (`src/controllers/orderController.js`)

تم تحديث دالة `checkout` لدمج حقول عنوان الشحن الجديدة وحساب تكلفة الشحن الديناميكية.

**دالة `checkout` (`POST /api/checkout`)**

**تغييرات نص الطلب:**
يتوقع كائن `shippingAddress` في نص الطلب لنقطة نهاية `checkout` الآن حقولًا إضافية:

```json
{
  "shippingAddress": {
    "address": "123 Main St",
    "detailedAddress": "Apt 4B", // جديد: اختياري
    "city": "Cairo",
    "governorate": "القاهرة", // جديد: مطلوب لحساب الشحن
    "postalCode": "12345",
    "country": "Egypt",
    "phone": "01012345678",
    "email": "user@example.com" // جديد: اختياري
  },
  "paymentMethod": "COD", // أو "wallet", "card"
  "walletNumber": "01012345678", // مطلوب إذا كانت طريقة الدفع 'wallet'
  "guestName": "Guest User" // مطلوب إذا لم يكن المستخدم مسجلاً للدخول
}
```

**تغييرات منطق الواجهة الخلفية:**
*   تقوم دالة `checkout` الآن بالتحقق من وجود `governorate` في `shippingAddress`.
*   تستدعي `await getShippingDetails(governorate)` (وهي الآن غير متزامنة) لاسترداد `shippingCost` و `deliveryTime`.
*   يتم الآن حساب `totalPrice` للطلب على أنه `itemsTotalPrice + shippingCost`.
*   سيتضمن كائن `shippingAddress` المخزن في نموذج `Order` حقول `detailedAddress` و `email` و `shippingCost` و `deliveryTime`.
*   يتم تحديث `billingData` الخاص بـ Paymob لاستخدام `shippingAddress.email` و `shippingAddress.detailedAddress` (لـ `apartment`) و `shippingAddress.governorate` (لـ `state`).

**تأثير الواجهة الأمامية:**
*   يجب على الواجهة الأمامية التأكد من إرسال حقل `governorate` دائمًا في `shippingAddress` عند الدفع.
*   يجب عليها أيضًا إرسال `detailedAddress` و `email` إذا كانت متاحة/مطلوبة من قبل المستخدم.
*   يجب أن تكون الواجهة الأمامية على دراية بأن `totalPrice` الذي يتم إرجاعه في تأكيد الطلب سيتضمن تكاليف الشحن.

---

## 5. نقاط نهاية `shippingRateController.js` الجديدة (`src/controllers/shippingRateController.js`)

توفر وحدة التحكم الجديدة هذه نقاط نهاية API لإدارة واسترداد أسعار الشحن.

### نقطة نهاية عامة: الحصول على تفاصيل الشحن حسب المحافظة

*   **الوصف:** تسمح لأي عميل (مستخدم الواجهة الأمامية) باسترداد تكلفة الشحن ووقت التسليم المقدر لمحافظة معينة.
*   **المسار:** `GET /api/shippingrates/public/:governorate`
*   **الوصول:** عام (لا يتطلب مصادقة)
*   **الطلب:**
    *   **الطريقة:** `GET`
    *   **معلمات URL:**
        *   `:governorate` (سلسلة نصية، مطلوب): اسم المحافظة (على سبيل المثال، "القاهرة").
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping details fetched successfully",
      "data": {
        "cost": 70,
        "time": "24 ل 48 ساعة"
      }
    }
    ```
*   **الاستجابة (خطأ - 404 Not Found):**
    ```json
    {
      "success": false,
      "message": "Shipping details not found for this governorate",
      "data": []
    }
    ```
*   **الاستجابة (خطأ - 500 Internal Server Error):**
    ```json
    {
      "success": false,
      "message": "Failed to fetch public shipping details",
      "data": []
    }
    ```

### نقاط نهاية المسؤول (تتطلب `protect` و `admin` middleware)

هذه النقاط مخصصة لأغراض إدارية لإدارة أسعار الشحن.

#### 5.1. إنشاء سعر شحن

*   **الوصف:** ينشئ إدخال سعر شحن جديد في قاعدة البيانات.
*   **المسار:** `POST /api/shippingrates`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `POST`
    *   **النص (application/json):**
        ```json
        {
          "governorate": "الإسكندرية",
          "cost": 80,
          "time": "4 أيام عمل"
        }
        ```
*   **الاستجابة (نجاح - 201 Created):**
    ```json
    {
      "success": true,
      "message": "Shipping rate created successfully",
      "data": {
        "_id": "65e8a7b0c1d2e3f4a5b6c7d8",
        "governorate": "الإسكندرية",
        "cost": 80,
        "time": "4 أيام عمل",
        "createdAt": "2024-03-06T12:00:00.000Z",
        "updatedAt": "2024-03-06T12:00:00.000Z",
        "__v": 0
      }
    }
    ```
*   **الاستجابة (خطأ - 400 Bad Request):**
    ```json
    {
      "success": false,
      "message": "Shipping rate for this governorate already exists",
      "data": []
    }
    ```

#### 5.2. الحصول على جميع أسعار الشحن

*   **الوصف:** يسترد جميع أسعار الشحن من قاعدة البيانات.
*   **المسار:** `GET /api/shippingrates`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `GET`
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping rates fetched successfully",
      "data": [
        {
          "_id": "65e8a7b0c1d2e3f4a5b6c7d8",
          "governorate": "القاهرة",
          "cost": 70,
          "time": "24 ل 48 ساعة",
          "createdAt": "2024-03-06T12:00:00.000Z",
          "updatedAt": "2024-03-06T12:00:00.000Z",
          "__v": 0
        },
        // ... المزيد من أسعار الشحن
      ]
    }
    ```

#### 5.3. الحصول على سعر شحن حسب المعرف

*   **الوصف:** يسترد سعر شحن واحد حسب معرف قاعدة البيانات الخاص به.
*   **المسار:** `GET /api/shippingrates/:id`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `GET`
    *   **معلمات URL:**
        *   `:id` (سلسلة نصية، مطلوب): `_id` الخاص بسعر الشحن في MongoDB.
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping rate fetched successfully",
      "data": {
        "_id": "65e8a7b0c1d2e3f4a5b6c7d8",
        "governorate": "القاهرة",
        "cost": 70,
        "time": "24 ل 48 ساعة",
        "createdAt": "2024-03-06T12:00:00.000Z",
        "updatedAt": "2024-03-06T12:00:00.000Z",
        "__v": 0
      }
    }
    ```
*   **الاستجابة (خطأ - 404 Not Found):**
    ```json
    {
      "success": false,
      "message": "Shipping rate not found",
      "data": []
    }
    ```

#### 5.4. تحديث سعر شحن

*   **الوصف:** يقوم بتحديث سعر شحن موجود حسب معرف قاعدة البيانات الخاص به.
*   **المسار:** `PUT /api/shippingrates/:id`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `PUT`
    *   **معلمات URL:**
        *   `:id` (سلسلة نصية، مطلوب): `_id` الخاص بسعر الشحن في MongoDB.
    *   **النص (application/json):**
        ```json
        {
          "cost": 75,
          "time": "48 ساعة"
        }
        ```
        (يمكنك تحديث حقل واحد أو أكثر: `governorate`، `cost`، `time`)
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping rate updated successfully",
      "data": {
        "_id": "65e8a7b0c1d2e3f4a5b6c7d8",
        "governorate": "القاهرة",
        "cost": 75,
        "time": "48 ساعة",
        "createdAt": "2024-03-06T12:00:00.000Z",
        "updatedAt": "2024-03-06T12:30:00.000Z",
        "__v": 0
      }
    }
    ```
*   **الاستجابة (خطأ - 404 Not Found):**
    ```json
    {
      "success": false,
      "message": "Shipping rate not found",
      "data": []
    }
    ```
*   **الاستجابة (خطأ - 400 Bad Request):**
    ```json
    {
      "success": false,
      "message": "Shipping rate for this governorate already exists",
      "data": []
    }
    ```

#### 5.5. حذف سعر شحن

*   **الوصف:** يحذف سعر شحن حسب معرف قاعدة البيانات الخاص به.
*   **المسار:** `DELETE /api/shippingrates/:id`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `DELETE`
    *   **معلمات URL:**
        *   `:id` (سلسلة نصية، مطلوب): `_id` الخاص بسعر الشحن في MongoDB.
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping rate deleted successfully",
      "data": {}
    }
    ```
*   **الاستجابة (خطأ - 404 Not Found):**
    ```json
    {
      "success": false,
      "message": "Shipping rate not found",
      "data": []
    }
    ```

### نقطة نهاية المسؤول: تغذية أسعار الشحن الأولية

*   **الوصف:** تشغل عملية تغذية أسعار الشحن الأولية في قاعدة البيانات. سيؤدي هذا إلى مسح الأسعار الموجودة وإدراج المجموعة المحددة مسبقًا.
*   **المسار:** `POST /api/shippingrates/seed`
*   **الوصول:** مسؤول
*   **الطلب:**
    *   **الطريقة:** `POST`
    *   **النص:** (لا يتطلب نصًا)
*   **الاستجابة (نجاح - 200 OK):**
    ```json
    {
      "success": true,
      "message": "Shipping rates seeded successfully!"
    }
    ```
*   **الاستجابة (خطأ - 500 Internal Server Error):**
    ```json
    {
      "success": false,
      "message": "Failed to seed shipping rates",
      "data": []
    }
    ```

---

## 6. نقاط نهاية `shippingRateRoutes.js` الجديدة (`src/routes/shippingRateRoutes.js`)

يحدد هذا الملف مسارات API لوحدة التحكم `shippingRateController.js`.

**المسارات الجديدة:**
```javascript
router.route('/')
  .post(protect, admin, createShippingRate) // مسؤول: إنشاء سعر جديد
  .get(protect, admin, getShippingRates);   // مسؤول: الحصول على جميع الأسعار

router.route('/:id')
  .get(protect, admin, getShippingRateById) // مسؤول: الحصول على سعر حسب المعرف
  .put(protect, admin, updateShippingRate)   // مسؤول: تحديث سعر حسب المعرف
  .delete(protect, admin, deleteShippingRate); // مسؤول: حذف سعر حسب المعرف

router.route('/public/:id')
  .get(getPublicShippingDetails); // عام: الحصول على تفاصيل الشحن حسب المعرف

router.route('/public')
  .get(getAllShippingRatesPublic); // عام: الحصول على جميع أسعار الشحن العامة

router.route('/seed')
  .post(protect, admin, seedShippingRatesAdmin); // مسؤول: تغذية الأسعار الأولية
```

**تأثير الواجهة الأمامية:**
*   ستستخدم الواجهة الأمامية `GET /api/shippingrates/public/:governorate` لجلب تكاليف الشحن وأوقات التسليم ديناميكيًا لعرضها على المستخدمين.
*   يمكن للوحات الإدارة في الواجهة الأمامية استخدام نقاط نهاية `/api/shippingrates` الأخرى لإدارة CRUD الكاملة لأسعار الشحن.

---

## ملاحظة هامة للتغذية الأولية للبيانات:

هذا يختتم التوثيق التفصيلي لتغييرات الواجهة الخلفية.
