# دليل التعامل مع صور البانرات (Banner Images) للفرونت اند

تم تحديث النظام لدعم رفع ومعالجة وعرض صور البانرات بأنواع وأبعاد مختلفة (موبايل/لابتوب). هذا الدليل يوضح كيفية تفاعل الفرونت اند مع نقاط النهاية (Endpoints) الجديدة.

## 1. الفكرة الأساسية

النظام يسمح برفع صور البانرات وتحديد نوعها (mobile, laptop, general) ليتم معالجتها بأبعاد ثابتة (16:9 للموبايل، 21:9 للابتوب). يتم تخزين الصور على خدمة `ImageBB`، ويتم حفظ روابطها في قاعدة البيانات.

## 2. نقاط النهاية (Endpoints)

### أ. رفع صورة بانر جديدة (POST /api/images/upload)

-   **الوصف**: لرفع صورة جديدة، مع تحديد نوعها (mobile, laptop, general) واسم لها.
-   **المصادقة**: تتطلب `Admin Token` (يجب أن يكون المستخدم مسؤولاً).
-   **الطلب (Request)**:
    -   **النوع**: `multipart/form-data`
    -   **الحقول**:
        -   `image`: (File) ملف الصورة نفسه.
        -   `type`: (String, اختياري) نوع الصورة. القيم المسموح بها: `mobile`, `laptop`, `general`. إذا لم يتم تحديده، سيتم التعامل معها كـ `general`.

-   **مثال Axios**:

    ```javascript
    import axios from 'axios';

    const uploadBannerImage = async (file, type, adminToken) => {
      const formData = new FormData();
      formData.append('image', file);
      if (type) {
        formData.append('type', type);
      }

      try {
        const response = await axios.post('http://localhost:5000/api/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log('Image Uploaded:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error uploading image:', error.response ? error.response.data : error.message);
        throw error;
      }
    };

    // مثال للاستخدام:
    // const imageFile = /* ملف الصورة من input type="file" */;
    // const adminAuthToken = 'YOUR_ADMIN_JWT_TOKEN';
    // uploadBannerImage(imageFile, 'mobile', adminAuthToken);
    ```

-   **الاستجابة الناجحة (Success Response - Status 201 Created)**:

    ```json
    {
      "success": true,
      "message": "Image uploaded and processed successfully",
      "data": {
        "_id": "65f123abc...",
        "originalPath": "https://i.ibb.co/original_image_url.jpg",
        "mobilePath": "https://i.ibb.co/mobile_processed_image_url.jpg",
        "laptopPath": null, // أو رابط إذا كان النوع laptop
        "type": "mobile",
        "aspectRatio": "16:9",
        "deleteUrl": "https://ibb.co/delete_url_example", // رابط الحذف من ImageBB
        "createdAt": "2024-03-13T...",
        "updatedAt": "2024-03-13T...",
        "__v": 0
      }
    }
    ```

-   **الاستجابة عند الخطأ (Error Response - Status 400/500)**:

    ```json
    {
      "success": false,
      "message": "Failed to upload or process image",
      "errors": ["No image file provided"]
    }
    ```

### ب. الحصول على جميع صور البانرات (GET /api/images)

-   **الوصف**: لاسترداد قائمة بجميع صور البانرات المحفوظة.
-   **المصادقة**: لا تتطلب مصادقة (عامة، مخصصة للمعاينة الإدارية).
-   **الطلب (Request)**: لا يوجد.
-   **مثال Axios**:

    ```javascript
    import axios from 'axios';

    const getBannerImages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/images');
        console.log('Banner Images:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching images:', error.response ? error.response.data : error.message);
        throw error;
      }
    };

    // مثال للاستخدام:
    // getBannerImages();
    ```

-   **الاستجابة الناجحة (Success Response - Status 200 OK)**:

    ```json
    {
      "success": true,
      "message": "Images fetched successfully",
      "data": [
        {
          "_id": "65f123abc...",
          "originalPath": "https://i.ibb.co/original_image_url.jpg",
          "mobilePath": "https://i.ibb.co/mobile_processed_image_url.jpg",
          "laptopPath": null,
          "type": "mobile",
          "aspectRatio": "16:9",
          "deleteUrl": "https://ibb.co/delete_url_example",
          "createdAt": "2024-03-13T...",
          "updatedAt": "2024-03-13T...",
          "__v": 0
        },
        {
          "_id": "65f456def...",
          "originalPath": "https://i.ibb.co/original_image_url_2.jpg",
          "mobilePath": null,
          "laptopPath": "https://i.ibb.co/laptop_processed_image_url_2.jpg",
          "type": "laptop",
          "aspectRatio": "21:9",
          "deleteUrl": "https://ibb.co/delete_url_example_2",
          "createdAt": "2024-03-14T...",
          "updatedAt": "2024-03-14T...",
          "__v": 0
        }
      ]
    }
    ```

### ج. حذف صورة بانر (DELETE /api/images/:id)

-   **الوصف**: لحذف سجل صورة بانر من قاعدة البيانات **وحذف الصورة من ImageBB** باستخدام `deleteUrl` المخزن.
-   **المصادقة**: تتطلب `Admin Token` (يجب أن يكون المستخدم مسؤولاً).
-   **الطلب (Request)**:
    -   **المعلمات (Params)**: `id` (معرف الصورة).

-   **مثال Axios**:

    ```javascript
    import axios from 'axios';

    const deleteBannerImage = async (imageId, adminToken) => {
      try {
        const response = await axios.delete(`http://localhost:5000/api/images/${imageId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log('Image Deleted:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error deleting image:', error.response ? error.response.data : error.message);
        throw error;
      }
    };

    // مثال للاستخدام:
    // const imageIdToDelete = '65f123abc...';
    // const adminAuthToken = 'YOUR_ADMIN_JWT_TOKEN';
    // deleteBannerImage(imageIdToDelete, adminAuthToken);
    ```

-   **الاستجابة الناجحة (Success Response - Status 200 OK)**:

    ```json
    {
      "success": true,
      "message": "Image removed successfully",
      "data": null
    }
    ```

-   **الاستجابة عند الخطأ (Error Response - Status 404/500)**:

    ```json
    {
      "success": false,
      "message": "Image not found",
      "errors": []
    }
    ```

## 3. ملاحظات هامة

-   **تخزين الصور**: يتم رفع الصور إلى خدمة `ImageBB`. عند حذف صورة من نظامنا، يتم استخدام `deleteUrl` المخزن لحذف الصورة من `ImageBB` أولاً، ثم يتم حذف سجلها من قاعدة البيانات.
-   **مسارات الصور**: الروابط التي يتم إرجاعها في `originalPath`, `mobilePath`, `laptopPath` هي روابط مباشرة للصور على `ImageBB`.
-   **المصادقة**: تأكد من إرسال `Admin Token` صالح في ترويسة `Authorization` للمسارات التي تتطلب مصادقة.
-   **`IMGBB_API_KEY`**: تأكد من أن مفتاح `ImageBB API Key` الخاص بك تم إعداده بشكل صحيح في ملف `.env` الخاص بالباك اند.
