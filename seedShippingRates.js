import 'dotenv/config';
import mongoose from 'mongoose';
import ShippingRate from './src/models/ShippingRate.js';

const shippingRatesData = [
  { governorate: 'القاهرة', cost: 70, time: '24 ل 48 ساعة' },
  { governorate: 'الجيزة', cost: 70, time: '24 ل 48 ساعة' },
  { governorate: 'الزقازيق داخلي', cost: 45, time: '24 ل 48 ساعة' },
  { governorate: 'اطراف الزقازيق', cost: 60, time: '24 ل 48 ساعة' },
  { governorate: 'مراكز الشرقية', cost: 60, time: '24 ل 48 ساعة' },
  { governorate: 'بدر', cost: 75, time: '48 ساعة' },
  { governorate: 'مدينتي', cost: 75, time: '48 ساعة' },
  { governorate: 'المستقبل', cost: 75, time: '48 ساعة' },
  { governorate: 'الشروق', cost: 75, time: '48 ساعة' },
  { governorate: 'العبور', cost: 75, time: '48 ساعة' },
  { governorate: 'حدائق اكتوبر', cost: 75, time: '48 ساعة' },
  { governorate: 'السادس من اكتوبر', cost: 75, time: '48 ساعة' },
  { governorate: 'الشيخ زايد', cost: 75, time: '48 ساعة' },
  { governorate: 'حدائق الاهرام', cost: 75, time: '48 ساعة' },
  { governorate: 'التجمعات', cost: 75, time: '48 ساعة' },
  { governorate: 'الرحاب', cost: 75, time: '48 ساعة' },
  { governorate: 'البدرشين', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'الحوامديه', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'ابو النمرس', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'شبرامنت', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'سقاره', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'المناوات', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'ابو رجوان', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'بهرمس', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'برقاش', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'المناشي', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'التبين', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'اطفيح', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'الصف', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'العياط', cost: 75, time: 'يومين (السبت والثلاثاء)' },
  { governorate: 'القليوبية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'المنوفية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'الغربية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'دمياط', cost: 80, time: '4 أيام عمل' },
  { governorate: 'السويس', cost: 80, time: '4 أيام عمل' },
  { governorate: 'الدقهلية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'الاسماعيلية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'بورسعيد', cost: 80, time: '4 أيام عمل' },
  { governorate: 'كفر الشيخ', cost: 80, time: '4 أيام عمل' },
  { governorate: 'الاسكندرية', cost: 80, time: '4 أيام عمل' },
  { governorate: 'البحيرة', cost: 85, time: '4 أيام عمل' },
  { governorate: 'الفيوم', cost: 105, time: '4 أيام عمل' },
  { governorate: 'بني سويف', cost: 105, time: '4 أيام عمل' },
  { governorate: 'المنيا', cost: 105, time: '4 أيام عمل' },
  { governorate: 'أسيوط', cost: 105, time: '4 أيام عمل' },
  { governorate: 'سوهاج', cost: 105, time: '4 أيام عمل' },
  { governorate: 'الاقصر', cost: 105, time: '4 أيام عمل' },
  { governorate: 'قنا', cost: 105, time: '4 أيام عمل' },
  { governorate: 'اسوان', cost: 105, time: '4 أيام عمل' },
  { governorate: 'البحر الاحمر (الغردقه)', cost: 130, time: '5 أيام عمل' },
  { governorate: 'سفاجا', cost: 130, time: '5 أيام عمل' },
  { governorate: 'راس غارب', cost: 130, time: '5 أيام عمل' },
  { governorate: 'مرسى مطروح', cost: 130, time: '5 أيام عمل' },
  { governorate: 'العين السخنة', cost: 130, time: '5 أيام عمل' },
  { governorate: 'الوادي الجديد', cost: 130, time: '5 أيام عمل' },
  { governorate: 'العاصمة الإدارية', cost: 130, time: '5 أيام عمل' },
  { governorate: 'حدائق العاصمة', cost: 130, time: '5 أيام عمل' },
  { governorate: 'شرم الشيخ', cost: 130, time: '5 أيام عمل' },
  { governorate: 'شمال سيناء', cost: 130, time: '5 أيام عمل' },
];

export const seedShippingRates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    await ShippingRate.deleteMany({});
    console.log('Existing shipping rates cleared.');

    await ShippingRate.insertMany(shippingRatesData);
    console.log('Shipping rates seeded successfully!');
    return { success: true, message: 'Shipping rates seeded successfully!' };
  } catch (error) {
    console.error(`Error seeding shipping rates: ${error.message}`);
    return { success: false, message: `Error seeding shipping rates: ${error.message}` };
  }
};


