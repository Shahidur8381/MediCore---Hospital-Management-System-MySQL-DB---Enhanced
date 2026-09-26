'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowRight, ArrowLeft, User, Lock, Stethoscope, Check } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';

const STEPS = ['Account', 'Personal', 'Medical'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    name: '', gender: 'Male', dob: '',
    bloodGroup: '', phone: '', email: '', address: '', emergencyContact: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!formData.username.trim()) errs.username = 'Username is required';
      if (formData.username.length < 3) errs.username = 'Minimum 3 characters';
      if (!formData.password) errs.password = 'Password is required';
      if (formData.password.length < 6) errs.password = 'Minimum 6 characters';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (s === 1) {
      if (!formData.name.trim()) errs.name = 'Full name is required';
      if (!formData.dob) errs.dob = 'Date of birth is required';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    setIsLoading(true);
    
    try {
      // Strip confirmPassword and convert empty strings to undefined so the backend validator accepts them
      const { confirmPassword, ...rest } = formData;
      const payload: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(rest)) {
        payload[k] = v === '' ? undefined : v;
      }
      await api.post('/api/auth/register-patient', payload);
      toast('Account created successfully! Redirecting to login...', 'success');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Registration failed';
      toast(detail, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white/70 ${errors[field] ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-red-500 mt-1 font-medium">{errors[field]}</p> : null;

  return (
    <div className="flex-1 flex items-center justify-center gradient-mesh py-12 px-4 relative overflow-hidden">
      <div className="absolute top-10 right-[20%] w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
      <div className="absolute bottom-10 left-[15%] w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-xl glass-card p-5 sm:p-8 animate-fade-in-up z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <img
              src="/images/logo.jpg"
              alt="MediCore Logo"
              className="w-12 h-12 rounded-2xl object-cover shadow-md hover:scale-105 transition-transform mx-auto"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Patient Registration</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">Join MediCore and manage your healthcare</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 sm:gap-2">
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                i < step ? 'bg-emerald-100 text-emerald-700' :
                i === step ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 sm:w-8 h-0.5 rounded-full transition-colors ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 0: Account */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Account Credentials</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className={inputClass('username')} placeholder="Choose a username" />
                <FieldError field="username" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass('password')} placeholder="Min. 6 characters" />
                <FieldError field="password" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClass('confirmPassword')} placeholder="Re-enter password" />
                <FieldError field="confirmPassword" />
              </div>
            </div>
          )}

          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="Your full name" />
                  <FieldError field="name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass('gender')}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass('dob')} />
                  <FieldError field="dob" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} placeholder="01XXXXXXXXX" />
                  <FieldError field="phone" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="you@example.com" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Medical Details</h3>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass('bloodGroup')}>
                  <option value="">Select blood group...</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass('address')} placeholder="Your address" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Emergency Contact (Phone)</label>
                <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className={inputClass('emergencyContact')} placeholder="Emergency contact number" />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button type="button" onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}
            
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.97]">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>Create Account <Check size={16} /></>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
