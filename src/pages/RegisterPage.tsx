// import React, { useEffect, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { ArrowRight, User, Lock, Phone, MapPin, Mail } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';

// const RegisterPage: React.FC = () => {
//   const { register } = useAuth();
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     fullName: '',
//     phone: '',
//     address: '',
//     governorate: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});
//   const [submitError, setSubmitError] = useState<string | null>(null);

//     // Scroll to top when the component mounts
//     useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   const governorates = [
//     'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية',
//     'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
//     'السويس', 'المنيا', 'بني سويف', 'الفيوم', 'أسيوط', 'سوهاج', 'قنا',
//     'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء',
//     'جنوب سيناء', 'دمياط'
//   ];

//   const validateForm = () => {
//     const newErrors: { [key: string]: string } = {};

//     if (!formData.fullName.trim()) {
//       newErrors.fullName = 'الاسم الكامل مطلوب';
//     }

//     if (!formData.phone.trim()) {
//       newErrors.phone = 'رقم الهاتف مطلوب';
//     } else if (!/^01[0-9]{9}$/.test(formData.phone)) {
//       newErrors.phone = 'رقم الهاتف غير صحيح';
//     }

//     if (!formData.address.trim()) {
//       newErrors.address = 'العنوان مطلوب';
//     }

//     if (!formData.governorate) {
//       newErrors.governorate = 'المحافظة مطلوبة';
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'البريد الإلكتروني مطلوب';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'البريد الإلكتروني غير صحيح';
//     }

//     if (!formData.password.trim()) {
//       newErrors.password = 'كلمة المرور مطلوبة';
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitError(null);

//     if (!validateForm()) {
//       return;
//     }

//     try {
//       await register(
//         formData.fullName,
//         formData.email,
//         formData.phone,
//         formData.address,
//         formData.governorate,
//         formData.password
//       );
//       // alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
//       navigate('/login');
//     } catch (error: any) {
//       setSubmitError(error.message || 'فشل إنشاء الحساب. حاول مرة أخرى.');
//     }
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="container mx-auto px-4">
//         <Link
//           to="/"
//           className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors"
//         >
//           <ArrowRight size={20} />
//           <span>العودة للرئيسية</span>
//         </Link>

//         <div className="max-w-md mx-auto">
//           <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
//             <div className="bg-gradient-to-l from-pink-600 to-purple-600 p-6 text-center">
//               <img 
//                 src="/اللجو.jpg" 
//                 alt="الشال" 
//                 className="h-16 w-16 mx-auto mb-3 object-contain"
//               />
//               <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'serif' }}>
//                 الشال
//               </h1>
//               <p className="text-pink-100">إنشاء حساب جديد</p>
//             </div>

//             <div className="p-6">
//               {submitError && (
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
//                   {submitError}
//                 </div>
//               )}
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     الاسم الكامل *
//                   </label>
//                   <div className="relative">
//                     <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                     <input
//                       type="text"
//                       value={formData.fullName}
//                       onChange={(e) => handleInputChange('fullName', e.target.value)}
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.fullName ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     رقم الهاتف *
//                   </label>
//                   <div className="relative">
//                     <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                     <input
//                       type="tel"
//                       value={formData.phone}
//                       onChange={(e) => handleInputChange('phone', e.target.value)}
//                       placeholder="01xxxxxxxxx"
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.phone ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     العنوان *
//                   </label>
//                   <div className="relative">
//                     <MapPin className="absolute right-3 top-3 text-gray-400" size={18} />
//                     <textarea
//                       value={formData.address}
//                       onChange={(e) => handleInputChange('address', e.target.value)}
//                       rows={2}
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.address ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     المحافظة *
//                   </label>
//                   <select
//                     value={formData.governorate}
//                     onChange={(e) => handleInputChange('governorate', e.target.value)}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                       errors.governorate ? 'border-red-500' : 'border-gray-300'
//                     }`}
//                     dir="rtl"
//                   >
//                     <option value="">اختر المحافظة</option>
//                     {governorates.map((gov) => (
//                       <option key={gov} value={gov}>{gov}</option>
//                     ))}
//                   </select>
//                   {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     البريد الإلكتروني *
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                     <input
//                       type="email"
//                       value={formData.email}
//                       onChange={(e) => handleInputChange('email', e.target.value)}
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.email ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     كلمة المرور *
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                     <input
//                       type="password"
//                       value={formData.password}
//                       onChange={(e) => handleInputChange('password', e.target.value)}
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.password ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     تأكيد كلمة المرور *
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                     <input
//                       type="password"
//                       value={formData.confirmPassword}
//                       onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
//                       className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
//                         errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
//                       }`}
//                       dir="rtl"
//                     />
//                   </div>
//                   {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-semibold"
//                 >
//                   إنشاء حساب
//                 </button>
//               </form>

//               <div className="mt-6 text-center">
//                 <p className="text-gray-600">
//                   لديك حساب بالفعل؟{' '}
//                   <Link to="/login" className="text-pink-600 hover:text-pink-700 font-semibold">
//                     تسجيل الدخول
//                   </Link>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;