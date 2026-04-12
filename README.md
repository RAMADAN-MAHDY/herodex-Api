<div dir="rtl">

# Herodex API - النظام الخلفي لمتجر مستحضرات التجميل (Cosmetics Store Backend)

واجهة برمجة تطبيقات (REST API) جاهزة للإنتاج لمتجر مستحضرات تجميل صغير، مبنية باستخدام Node.js و Express و MongoDB.

## المميزات
- **المصادقة (Authentication)**: تسجيل دخول للمسؤولين (Admin) والمستخدمين باستخدام JWT.
- **الأقسام (Categories)**: عمليات CRUD كاملة مع دعم رفع الصور عبر (ImageBB).
- **المنتجات (Products)**: عمليات CRUD كاملة مع دعم الصور، الترقيم (Pagination)، والربط بالأقسام.
- **الآراء (Reviews)**: نظام آراء يعتمد على الصور فقط مع إمكانية إدارة المسؤولين لها.
- **لوحة تحكم المسؤول (Admin Dashboard)**: إحصائيات لإجمالي المنتجات، الأقسام، والمستخدمين.
- **معالجة الأخطاء**: نظام مركزي لإدارة الأخطاء.
- **التحقق من البيانات (Validation)**: استخدام مكتبة Joi للتحقق من البيانات المدخلة.

## التقنيات المستخدمة
- **Node.js** & **Express.js**
- **MongoDB** مع **Mongoose**
- **JWT** للمصادقة وتأمين المسارات.
- **Multer** & **ImageBB API** لرفع الصور.
- **ES Modules** (استخدام import/export).

## المتطلبات الأساسية
- تثبيت Node.js.
- تثبيت MongoDB أو الحصول على رابط MongoDB Atlas.
- مفتاح API لخدمة ImageBB (يمكنك الحصول عليه من [imgbb.com](https://api.imgbb.com/)).

## التثبيت والتشغيل

1. انتقل إلى مجلد الباك إند:
   ```bash
   cd backend
   ```

2. تثبيت المكتبات المطلوبة:
   ```bash
   npm install
   ```

3. إعداد متغيرات البيئة:
   قم بإنشاء ملف `.env` في مجلد `backend` وأضف البيانات التالية:
   ```env
   PORT=5000
   MONGO_URI=رابط_قاعدة_البيانات
   JWT_SECRET=كلمة_سر_jwt
   IMGBB_API_KEY=مفتاح_api_imgbb
   ```

4. تشغيل السيرفر:
   - للتشغيل في وضع التطوير (مع التحديث التلقائي):
     ```bash
     npm run dev
     ```
   - للتشغيل في وضع الإنتاج:
     ```bash
     npm start
     ```

## هيكل استجابة API (Response Format)

### استجابة ناجحة (Success)
```json
{
  "success": true,
  "message": "رسالة النجاح هنا",
  "data": {}
}
```

### استجابة خطأ (Error)
```json
{
  "success": false,
  "message": "رسالة الخطأ هنا",
  "errors": []
}
```

## روابط API (Endpoints)

### المصادقة (Auth)
- `POST /api/auth/login` - تسجيل دخول المستخدم/المسؤول.
- `POST /api/auth/register` - تسجيل حساب جديد.

### الأقسام (Categories)
- `GET /api/categories` - جلب جميع الأقسام.
- `POST /api/categories` - إنشاء قسم جديد (للمسؤول فقط).
- `PUT /api/categories/:id` - تحديث قسم (للمسؤول فقط).
- `DELETE /api/categories/:id` - حذف قسم (للمسؤول فقط).

### المنتجات (Products)
- `GET /api/products?pageNumber=1&limit=10&category=ID` - جلب جميع المنتجات (مع الترقيم والفلترة).
  - `pageNumber`: رقم الصفحة (افتراضي: 1).
  - `limit`: عدد المنتجات في كل صفحة (افتراضي: 10).
  - `category`: معرف القسم لفلترة المنتجات (اختياري).
- `POST /api/products` - إنشاء منتج جديد (للمسؤول فقط).
- `PUT /api/products/:id` - تحديث منتج (للمسؤول فقط).
- `DELETE /api/products/:id` - حذف منتج (للمسؤول فقط).

### الآراء (Reviews)
- `GET /api/reviews` - جلب جميع صور الآراء.
- `POST /api/reviews` - إضافة صورة رأي جديد (للمسؤول فقط).
- `DELETE /api/reviews/:id` - حذف صورة رأي (للمسؤول فقط).

### الإحصائيات (Stats)
- `GET /api/stats` - جلب إحصائيات لوحة التحكم (للمسؤول فقط).

---

## دليل الربط مع الفرونت إند (Frontend Integration)

### التعامل مع الصور (FormData)
بما أن النظام يستخدم `multer` لرفع الصور، يجب إرسال طلبات الإضافة والتعديل الخاصة بالأقسام والمنتجات والآراء باستخدام `FormData` بدلاً من JSON العادي.

#### 1. إضافة قسم (Create Category)
**الحقول المطلوبة:**
- `name`: نص (إجباري).
- `description`: نص (اختياري).
- `image`: ملف صورة (إجباري).

#### 2. إضافة منتج (Create Product)
**الحقول المطلوبة:**
- `name`: نص (إجباري).
- `price`: رقم (إجباري).
- `description`: نص (إجباري).
- `category`: معرف القسم (Category ID) (إجباري).
- `image`: ملف صورة (إجباري).

#### 3. إضافة رأي (Create Review)
**الحقول المطلوبة:**
- `image`: ملف صورة (إجباري).

---

### أمثلة باستخدام Axios

#### 1. تسجيل الدخول (JSON)
```javascript
import axios from 'axios';

const login = async (email, password) => {
  try {
    const { data } = await axios.post('/api/auth/login', { email, password });
    // حفظ التوكن: localStorage.setItem('token', data.data.token);
    console.log(data.message);
  } catch (error) {
    console.error(error.response.data.message);
  }
};
```

#### 2. إضافة منتج جديد (FormData)
```javascript
const createProduct = async (productData, token) => {
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('price', productData.price);
  formData.append('description', productData.description);
  formData.append('category', productData.categoryId);
  formData.append('image', productData.imageFile); // كائن الملف المختار

  try {
    const { data } = await axios.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data.data); // كائن المنتج الذي تم إنشاؤه
  } catch (error) {
    console.error(error.response.data.message);
  }
};
```

#### 3. جلب المنتجات (مع الترقيم والليميت)
```javascript
const fetchProducts = async (page = 1, limit = 10, categoryId = '') => {
  try {
    const { data } = await axios.get(`/api/products?pageNumber=${page}&limit=${limit}&category=${categoryId}`);
    return data.data; // يحتوي على { products, page, pages }
  } catch (error) {
    console.error(error.response.data.message);
  }
};
```

### شرح هيكل الاستجابة (Response Structure)
- **`success`**: قيمة منطقية (Boolean). تكون `true` في حال النجاح و `false` في حال حدوث خطأ.
- **`message`**: نص (String). رسالة توضيحية لنتيجة العملية تظهر للمستخدم.
- **`data`**: كائن أو مصفوفة. تحتوي على البيانات الفعلية (مثل بيانات المستخدم أو قائمة المنتجات).
- **`errors`**: مصفوفة (Array). تظهر فقط في حال كان `success` هو `false` وتحتوي على تفاصيل أخطاء التحقق (Validation).

## قواعد التحقق من البيانات (Validation Rules)

يستخدم النظام مكتبة `Joi` لضمان صحة البيانات المدخلة. إليك القيود المفروضة على كل حقل:

### 1. المستخدمين (Users)
| الحقل | القيود (Constraints) | رسالة الخطأ (مثال) |
| :--- | :--- | :--- |
| **الاسم (name)** | نص، 3-50 حرف، إجباري | Name should have a minimum length of 3 |
| **البريد (email)** | بريد إلكتروني صالح، إجباري | Please provide a valid email address |
| **كلمة السر** | 6-30 حرف، إجباري | Password should have a minimum length of 6 |
| **الدور (role)** | 'user' أو 'admin' | Role must be either user or admin |

### 2. المنتجات (Products)
| الحقل | القيود (Constraints) | رسالة الخطأ (مثال) |
| :--- | :--- | :--- |
| **الاسم (name)** | نص، 2-100 حرف، إجباري | Product name should have at least 2 characters |
| **السعر (price)** | رقم، 0.01 - 1,000,000، إجباري | Price must be at least 0.01 |
| **الوصف** | نص، 10-1000 حرف، إجباري | Description should be at least 10 characters long |
| **القسم (category)** | معرف MongoDB (24 حرف)، إجباري | Invalid Category ID format |

### 3. الأقسام (Categories)
| الحقل | القيود (Constraints) | رسالة الخطأ (مثال) |
| :--- | :--- | :--- |
| **الاسم (name)** | نص، 2-50 حرف، إجباري | Category name should have at least 2 characters |
| **الوصف** | نص، بحد أقصى 255 حرف | Description cannot exceed 255 characters |

### أمثلة على الإدخال الخاطئ (Invalid Input Response)
في حال إرسال بيانات غير صالحة، سيرد السيرفر بـ `status 400` مع تفاصيل الأخطاء:
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    "Product name should have at least 2 characters",
    "Price must be at least 0.01"
  ]
}
```

</div>