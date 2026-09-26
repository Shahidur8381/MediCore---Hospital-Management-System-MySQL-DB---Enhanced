import Link from 'next/link';
import { Shield, Calendar, FileText, Activity, Users, Clock, ArrowRight, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <img
              src="/images/logo.jpg"
              alt="MediCore Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Medi<span className="text-blue-600">Core</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.97]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 gradient-mesh overflow-hidden min-h-[auto] lg:min-h-[92vh] flex items-center">
        {/* Animated ambient blobs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute top-40 right-[15%] w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-[35%] w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-2xs">
                <Sparkles size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">Next-Gen Smart Hospital Operating System</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.15] sm:leading-[1.1]">
                Modern Healthcare<br />
                Managed <span className="gradient-text">Intelligently</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed font-normal">
                Streamline your entire clinical and administrative workflow with MediCore. From real-time token queues and itemized digital prescriptions to SSLCommerz billing and verified laboratory diagnostics.
              </p>

              {/* CTAs */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.97] text-sm sm:text-base text-center"
                >
                  Create Patient Account
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-white text-gray-800 font-semibold hover:bg-gray-50 transition-all shadow-lg shadow-gray-200/50 border border-gray-200 text-sm sm:text-base text-center"
                >
                  Staff & Patient Login
                </Link>
              </div>

              {/* Key Highlights */}
              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-gray-200/60 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Real-time Live Queue TV</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>SSLCommerz Secured</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>ISO & HIPAA Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Photo Presentation */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border backdrop */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl filter blur-sm opacity-30"></div>
                
                {/* Image Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white">
                  <img
                    src="/images/hero-medical.jpg"
                    alt="MediCore Clinical Team in Smart Hospital"
                    className="w-full h-[280px] sm:h-[380px] lg:h-[440px] object-cover object-center transform hover:scale-102 transition-transform duration-500"
                  />
                  
                  {/* Floating Glass Pill Overlay */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 p-3 sm:p-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Activity size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-white tracking-wide truncate">24/7 Smart Clinical Care</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">Connected Physicians & Live Telemetry</div>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {[
            { label: 'Secure Records', icon: Shield, value: 'HIPAA Ready' },
            { label: 'Smart Scheduling', icon: Calendar, value: 'Real-time Token' },
            { label: 'Digital Prescriptions', icon: FileText, value: 'Itemized Rx' },
            { label: 'Clinical Uptime', icon: Activity, value: '99.9% 24/7' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                <stat.icon size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - Built for Every Role with Real Photos */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Built for Every Healthcare Role
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              MediCore provides specialized, intuitive environments tailored to administrators, physicians, diagnostics technicians, and patients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Admin Command Center',
                role: 'Administrator',
                description: 'Oversee departments, onboard physicians, manage billing ledger splits, and monitor hospital telemetry.',
                image: '/images/admin-portal.jpg',
                badge: 'Governance',
                badgeColor: 'bg-blue-100 text-blue-800'
              },
              {
                title: 'Doctor Consultation Suite',
                role: 'Physician / Doctor',
                description: 'Full OPD consultation cockpit with 10 clinical presets, biometric vitals tracking, and instant lab ordering.',
                image: '/images/doctor-portal.jpg',
                badge: 'Clinical Practice',
                badgeColor: 'bg-purple-100 text-purple-800'
              },
              {
                title: 'Patient Wellness Hub',
                role: 'Patient',
                description: 'Book doctor appointments, track real-time queue tokens, pay bills online, and view clinical test findings.',
                image: '/images/patient-portal.jpg',
                badge: 'Self-Service',
                badgeColor: 'bg-emerald-100 text-emerald-800'
              },
              {
                title: 'Diagnostic Lab Station',
                role: 'Laboratory Tech',
                description: 'Receive ordered lab investigations, record automated clinical values, and generate certified reports.',
                image: '/images/lab-portal.jpg',
                badge: 'Diagnostics',
                badgeColor: 'bg-amber-100 text-amber-800'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Photo Header */}
                <div className="h-44 overflow-hidden relative bg-slate-100">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-2xs ${feature.badgeColor}`}>
                      {feature.badge}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                      {feature.role}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href="/login"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                    >
                      Enter Portal <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4">
            Ready to Transform Your Hospital Experience?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-6 sm:mb-8 max-w-xl mx-auto">
            Experience state-of-the-art patient registration, consultation cockpits, and automated hospital workflows.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-white text-blue-700 font-bold hover:bg-gray-100 transition-all shadow-xl active:scale-[0.97] text-sm sm:text-base"
            >
              Get Started Now <ArrowRight size={18} />
            </Link>
            <Link
              href="/queue/display"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-blue-500/20 text-white font-semibold hover:bg-blue-500/30 border border-white/20 transition-all text-sm sm:text-base"
            >
              View Waiting Room TV
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/logo.jpg"
              alt="MediCore Logo"
              className="w-7 h-7 rounded-lg object-cover shadow-sm"
            />
            <span className="text-lg font-bold text-white tracking-tight">
              Medi<span className="text-blue-500">Core</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-center">
            <Clock size={14} className="shrink-0" />
            <span>© {new Date().getFullYear()} MediCore Smart Hospital Management System. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
