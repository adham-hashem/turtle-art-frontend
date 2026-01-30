import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Heart,
  ShoppingBag,
  Star,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [identifier, setIdentifier] = useState(''); // email OR username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  // Validate email (only used when user enters something that looks like email)
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const looksLikeEmail = (value: string) => value.includes('@');

  // Handle form validation
  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'البريد الإلكتروني أو اسم المستخدم مطلوب';
    } else if (looksLikeEmail(identifier.trim()) && !validateEmail(identifier.trim())) {
      errors.identifier = 'البريد الإلكتروني غير صحيح';
    }

    if (!password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle email/username + password login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoggingIn(true);
    setError('');

    try {
      // IMPORTANT:
      // We send identifier as-is to your AuthContext.login.
      // In your AuthContext, map it to the backend field (Email or Username) as your API expects.
      const loginResponse = await login(identifier.trim(), password);

      const from = (location.state as any)?.from?.pathname || loginResponse?.redirectTo || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoggingIn(true);
    setError('');

    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        throw new Error('لم يتم استلام رمز جوجل التعريفي.');
      }

      const loginResponse = await googleLogin(idToken);
      const from = (location.state as any)?.from?.pathname || loginResponse?.redirectTo || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err?.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In failed');
    setError('فشل تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.');
  };

  // Detect Safari/iOS browsers - One Tap doesn't work well on these
  const isSafariOrIOS = (): boolean => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const safari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
    return (iOS && webkit) || safari;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-24 pb-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-10 left-10 text-gray-300 animate-bounce">
        <ShoppingBag className="h-16 w-16" />
      </div>
      <div className="absolute top-20 right-20 text-gray-400 animate-pulse">
        <Sparkles className="h-12 w-12" />
      </div>
      <div className="absolute bottom-20 left-20 text-gray-300 animate-pulse">
        <Heart className="h-10 w-10 fill-current" />
      </div>
      <div className="absolute bottom-32 right-16 text-gray-300 animate-bounce delay-100">
        <Star className="h-8 w-8 fill-current" />
      </div>
      <div className="absolute top-1/2 left-5 text-gray-100">
        <ShoppingBag className="h-20 w-20 opacity-50" />
      </div>
      <div className="absolute top-1/3 right-5 text-gray-100">
        <Heart className="h-14 w-14 fill-current opacity-50" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center space-x-reverse space-x-2 text-black hover:text-gray-600 mb-6 transition-colors group"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">العودة للرئيسية</span>
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="relative bg-black p-8 text-center">
            {/* Animated Stars */}
            <div className="absolute top-3 right-6 animate-pulse">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="absolute top-6 left-8 animate-pulse delay-75">
              <Star className="h-4 w-4 text-white fill-current" />
            </div>
            <div className="absolute bottom-4 right-10 animate-pulse delay-150">
              <Heart className="h-4 w-4 text-white fill-current" />
            </div>

            {/* Logo */}
            <div className="relative inline-block mb-4">
              <div className="absolute -inset-2 bg-white/20 rounded-full blur-md"></div>
              <img
                src="/turtle_art_logo.jpeg"
                alt="Turtle Art"
                className="relative h-28 w-28 mx-auto rounded-full object-cover shadow-xl border-4 border-white/80"
              />
            </div>

            <h1
              className="text-3xl font-bold text-white mb-1 drop-shadow-lg"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              Turtle Art
            </h1>
            <p className="text-white/90 text-lg font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              فن الحقائب المميزة 🐢✨
            </p>
          </div>

          {/* Login Content */}
          <div className="p-8">
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-black" />
                <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  أهلاً بك!
                </h2>
                <Sparkles className="h-5 w-5 text-black" />
              </div>
              <p className="text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                سجل دخولك واستمتع بأجمل الحقائب المصممة بعناية
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoggingIn ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-black rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-black rounded-full p-4">
                    <ShoppingBag className="h-10 w-10 text-white animate-bounce" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-black font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    جاري تسجيل الدخول...
                  </p>
                  <p className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    نجهز لك أجمل التصاميم 👜
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Google Login */}
                <div className="flex justify-center">
                  <div className="transform hover:scale-105 transition-transform duration-200">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      width="300"
                      theme="outline"
                      size="large"
                      text="continue_with"
                      shape="pill"
                      locale="ar"
                      useOneTap={!isSafariOrIOS()} // Disable One Tap for Safari/iOS
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="text-center text-gray-400 text-xs" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <p>
                    بتسجيل الدخول، أنت توافق على{' '}
                    <span className="text-black hover:underline cursor-pointer">سياسة الخصوصية</span> و{' '}
                    <span className="text-black hover:underline cursor-pointer">شروط الاستخدام</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Banner */}
          <div className="bg-gray-50 p-4">
            <div className="flex items-center justify-center gap-6 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <div className="flex items-center gap-1 text-black">
                <ShoppingBag className="h-4 w-4" />
                <span>حقائب مميزة</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1 text-black">
                <Heart className="h-4 w-4 fill-current" />
                <span>صنع بحب</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1 text-black">
                <Star className="h-4 w-4 fill-current" />
                <span>جودة عالية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Cards */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300 border border-gray-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2">
              <span className="text-2xl">👜</span>
            </div>
            <p className="text-xs text-black font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              تصاميم فريدة
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300 border border-gray-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2">
              <span className="text-2xl">🚚</span>
            </div>
            <p className="text-xs text-black font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              توصيل سريع
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300 border border-gray-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-2">
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-xs text-black font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              أعلى تقييم
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
