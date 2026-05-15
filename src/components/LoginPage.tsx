import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Lock, Eye, EyeOff, AlertTriangle, Fingerprint, Cpu, Radio, Globe, Info, Mail, IdCard, Key, Truck, MapPin, Droplets, Bell, Users, Database, Settings } from 'lucide-react';
import { 
  authenticateAdmin, 
  authenticateCitizen, 
  authenticateDriver, 
  authenticateGuest,
  demoCredentials,
  type User as DBUser,
} from '../data/users';

interface LoginPageProps {
  onLogin: (user: { 
    email: string; 
    role: 'citizen' | 'bwssb_manager' | 'driver' | 'guest';
    sessionToken: string;
    userData: DBUser;
  }) => void;
}

type Role = 'citizen' | 'bwssb_manager' | 'driver' | 'guest';

interface RoleFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface RoleConfig {
  id: Role;
  label: string;
  icon: React.ReactNode;
  color: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  fieldIcon: React.ReactNode;
  instruction: string;
  showPassword: boolean;
  passwordLabel: string;
  tagline: string;
  features: RoleFeature[];
}

const roleConfigs: RoleConfig[] = [
  {
    id: 'citizen',
    label: 'Citizen',
    icon: <User size={14} />,
    color: 'neon',
    fieldLabel: 'BWSSB RR Number',
    fieldPlaceholder: 'e.g., W-1234567A',
    fieldIcon: <IdCard size={14} />,
    instruction: 'Please enter your unique 8-character BWSSB RR Number. This can be found at the top of your water bill or painted near your water meter to verify your water connection.',
    showPassword: true,
    passwordLabel: 'Password',
    tagline: 'Residential user tier for municipal water services',
    features: [
      { icon: <Truck size={12} />, title: 'Request Tanker', description: 'Submit on-demand requests for water tanker delivery to your verified address' },
      { icon: <MapPin size={12} />, title: 'Track Tanker', description: 'View real-time GPS tracking and ETA for your dispatched water tanker' },
      { icon: <Droplets size={12} />, title: 'Report Leakage', description: 'Lodge location-tagged complaints for burst pipelines or water wastage' },
    ],
  },
  {
    id: 'driver',
    label: 'Driver',
    icon: <Cpu size={14} />,
    color: 'amber',
    fieldLabel: 'Driver ID / Employee ID',
    fieldPlaceholder: 'e.g., DRV-2026-987',
    fieldIcon: <IdCard size={14} />,
    instruction: 'Enter your official Driver ID assigned by the transport authority or contractor to authorize your tanker profile.',
    showPassword: true,
    passwordLabel: 'Password',
    tagline: 'Operational field tier for transit & safety',
    features: [
      { icon: <Users size={12} />, title: 'View Requests', description: 'Access pending citizen requests with customer details and route navigation' },
      { icon: <Bell size={12} />, title: 'Emergency SOS', description: 'Trigger immediate notification to all nearby drivers in emergencies' },
      { icon: <Radio size={12} />, title: 'Peer Alerts', description: 'Receive real-time push alerts when another driver broadcasts SOS' },
    ],
  },
  {
    id: 'bwssb_manager',
    label: 'BWSSB Manager',
    icon: <Shield size={14} />,
    color: 'cyan',
    fieldLabel: 'Admin ID / Security Token',
    fieldPlaceholder: 'e.g., ADMIN-001',
    fieldIcon: <Key size={14} />,
    instruction: 'Enter your authorized Admin ID and secure access token. This action is logged for internal security auditing.',
    showPassword: true,
    passwordLabel: 'Secure Access Token',
    tagline: 'Administrative tier with master privileges',
    features: [
      { icon: <Database size={12} />, title: 'Total Control', description: 'Manage all user profiles, tanker databases, and active requests' },
      { icon: <Settings size={12} />, title: 'Infrastructure', description: 'Assign dispatch schedules, configure parameters, oversee networks' },
      { icon: <Shield size={12} />, title: 'Full Access', description: 'Monitor logs, metrics, distribution maps, and operational reports' },
    ],
  },
  {
    id: 'guest',
    label: 'Guest',
    icon: <Globe size={14} />,
    color: 'text-secondary',
    fieldLabel: 'Email Address',
    fieldPlaceholder: 'alex@example.com',
    fieldIcon: <Mail size={14} />,
    instruction: 'Enter your email address to receive a one-time verification link for temporary guest access.',
    showPassword: false,
    passwordLabel: '',
    tagline: 'Public tier for limited system observation',
    features: [
      { icon: <MapPin size={12} />, title: 'Track Tankers', description: 'Monitor public tanker routes and neighborhood dispatch statistics' },
      { icon: <Droplets size={12} />, title: 'Report Leak', description: 'Submit infrastructure damage or street water line leakage reports' },
    ],
  },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [role, setRole] = useState<Role>('citizen');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStep, setAuthStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const currentConfig = roleConfigs.find(r => r.id === role)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const steps = role === 'guest' 
      ? ['VALIDATING EMAIL...', 'GENERATING OTP...', 'SENDING VERIFICATION LINK...', 'CHECK YOUR INBOX']
      : ['VALIDATING CREDENTIALS...', 'QUERYING DATABASE...', 'VERIFYING ACCESS LEVEL...', 'ACCESS GRANTED'];
    
    for (let i = 0; i < steps.length; i++) {
      setAuthStep(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Validate based on role
    let authResult;
    
    switch (role) {
      case 'bwssb_manager':
        authResult = authenticateAdmin(identifier, password);
        break;
      case 'citizen':
        authResult = authenticateCitizen(identifier, password);
        break;
      case 'driver':
        authResult = authenticateDriver(identifier, password);
        break;
      case 'guest':
        authResult = authenticateGuest(identifier);
        break;
      default:
        authResult = { success: false, user: null, error: 'Invalid role', sessionToken: null };
    }

    setIsLoading(false);
    setAuthStep(0);

    if (!authResult.success || !authResult.user) {
      setError(authResult.error || 'Authentication failed');
      return;
    }

    // For guest, show OTP sent message first
    if (role === 'guest') {
      setOtpSent(true);
      setTimeout(() => {
        onLogin({
          email: authResult.user!.email,
          role: 'guest',
          sessionToken: authResult.sessionToken!,
          userData: authResult.user!,
        });
      }, 2000);
      return;
    }

    // Map database role to app role
    const appRole = authResult.user.role === 'admin' ? 'bwssb_manager' : authResult.user.role;
    
    // Login successful
    onLogin({
      email: authResult.user.email,
      role: appRole as 'citizen' | 'bwssb_manager' | 'driver' | 'guest',
      sessionToken: authResult.sessionToken!,
      userData: authResult.user,
    });
  };

  const authSteps = role === 'guest'
    ? ['VALIDATING EMAIL...', 'GENERATING OTP...', 'SENDING VERIFICATION LINK...', 'CHECK YOUR INBOX']
    : ['VALIDATING CREDENTIALS...', 'QUERYING DATABASE...', 'VERIFYING ACCESS LEVEL...', 'ACCESS GRANTED'];

  const getColorClass = (colorName: string, type: 'text' | 'bg' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      neon: { text: 'text-neon', bg: 'bg-neon', border: 'border-neon' },
      amber: { text: 'text-amber', bg: 'bg-amber', border: 'border-amber' },
      cyan: { text: 'text-cyan', bg: 'bg-cyan', border: 'border-cyan' },
      'text-secondary': { text: 'text-text-secondary', bg: 'bg-text-secondary', border: 'border-text-secondary' },
    };
    return colors[colorName]?.[type] || '';
  };

  const fillDemoCredentials = (demoRole: 'admin' | 'citizen' | 'driver' | 'guest') => {
    switch (demoRole) {
      case 'admin':
        setRole('bwssb_manager');
        setIdentifier(demoCredentials.admin.adminId);
        setPassword(demoCredentials.admin.accessToken);
        break;
      case 'citizen':
        setRole('citizen');
        setIdentifier(demoCredentials.citizen.rrNumber);
        setPassword(demoCredentials.citizen.password);
        break;
      case 'driver':
        setRole('driver');
        setIdentifier(demoCredentials.driver.driverId);
        setPassword(demoCredentials.driver.password);
        break;
      case 'guest':
        setRole('guest');
        setIdentifier(demoCredentials.guest.email);
        setPassword('');
        break;
    }
    setError('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <div className="w-3 h-3 rounded-full bg-sky-500" />
            <span className="text-xl font-bold tracking-wider text-[#1E293B]">AquaSphere AI</span>
          </motion.div>
          <p className="text-[10px] font-mono text-text-dim uppercase tracking-[0.3em]">
            AquaFlow Intelligence • Bengaluru CMD
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-lg">
          {/* Card header */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-cyan" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-primary">
                Secure Authentication Portal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono text-neon">256-BIT AES</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Role selection */}
            <div>
              <label className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-dim block mb-2">
                Select Access Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {roleConfigs.map((r) => (
                  <motion.button
                    key={r.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRole(r.id);
                      setIdentifier('');
                      setPassword('');
                      setError('');
                      setOtpSent(false);
                      setShowFeatures(false);
                    }}
                    className={`py-2.5 rounded border font-mono text-[8px] uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      role === r.id
                        ? `${getColorClass(r.color, 'border')}/40 ${getColorClass(r.color, 'bg')}/15 ${getColorClass(r.color, 'text')}`
                        : 'border-border-dim text-text-dim hover:text-text-secondary hover:border-border-dim/80'
                    }`}
                  >
                    {r.icon}
                    {r.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Role header with features toggle */}
            <motion.div
              key={role}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded border ${getColorClass(currentConfig.color, 'border')}/20 ${getColorClass(currentConfig.color, 'bg')}/5 overflow-hidden`}
            >
              <div 
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setShowFeatures(!showFeatures)}
              >
                <div className="flex items-center gap-2">
                  <div className={`${getColorClass(currentConfig.color, 'text')}`}>
                    {currentConfig.icon}
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono font-semibold ${getColorClass(currentConfig.color, 'text')} block`}>
                      {currentConfig.label.toUpperCase()} MODE
                    </span>
                    <span className="text-[8px] font-mono text-text-dim">{currentConfig.tagline}</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showFeatures ? 180 : 0 }}
                  className="text-text-dim"
                >
                  <Info size={12} />
                </motion.div>
              </div>
              
              {/* Features panel */}
              <AnimatePresence>
                {showFeatures && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border-dim/50 overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      {currentConfig.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <div className={`${getColorClass(currentConfig.color, 'text')} mt-0.5 shrink-0`}>
                            {feature.icon}
                          </div>
                          <div>
                            <span className={`text-[9px] font-mono font-semibold ${getColorClass(currentConfig.color, 'text')} block`}>
                              {feature.title}
                            </span>
                            <span className="text-[8px] font-mono text-text-dim leading-relaxed">
                              {feature.description}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* OTP Sent Message for Guest */}
            {otpSent && role === 'guest' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neon/10 border border-neon/30 rounded-lg p-4 text-center"
              >
                <Mail size={32} className="text-neon mx-auto mb-2" />
                <h3 className="text-sm font-mono font-bold text-neon mb-1">Verification Link Sent!</h3>
                <p className="text-[10px] font-mono text-text-secondary">
                  Check your inbox at <span className="text-cyan">{identifier}</span>
                </p>
                <p className="text-[9px] font-mono text-text-dim mt-2">
                  Redirecting to guest dashboard...
                </p>
                <div className="mt-3 h-1 bg-bg-primary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                    className="h-full bg-gradient-to-r from-neon to-cyan rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {!otpSent && (
              <>
                {/* Instruction box */}
                <motion.div
                  key={`instruction-${role}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-bg-card/50 border border-border-dim rounded p-3"
                >
                  <div className="flex items-start gap-2">
                    <Info size={12} className={`${getColorClass(currentConfig.color, 'text')} shrink-0 mt-0.5`} />
                    <p className="text-[9px] font-mono text-text-secondary leading-relaxed">
                      {currentConfig.instruction}
                    </p>
                  </div>
                </motion.div>

                {/* Identifier field */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-dim block mb-1.5">
                    {currentConfig.fieldLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
                      {currentConfig.fieldIcon}
                    </div>
                    <input
                      type={role === 'guest' ? 'email' : 'text'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={`w-full bg-bg-primary border border-border-dim rounded pl-10 pr-3 py-2.5 font-mono text-sm text-text-primary focus:border-cyan/40 focus:outline-none transition-colors placeholder:text-text-dim`}
                      placeholder={currentConfig.fieldPlaceholder}
                    />
                  </div>
                </div>

                {/* Password field - only for non-guest */}
                {currentConfig.showPassword && (
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-dim block mb-1.5">
                      {currentConfig.passwordLabel}
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-bg-primary border border-border-dim rounded pl-10 pr-10 py-2.5 font-mono text-sm text-text-primary focus:border-cyan/40 focus:outline-none transition-colors placeholder:text-text-dim"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-2 bg-red/10 border border-red/30 rounded px-3 py-2"
                    >
                      <AlertTriangle size={14} className="text-red shrink-0 mt-0.5" />
                      <span className="text-[10px] font-mono text-red">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading state */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`${getColorClass(currentConfig.color, 'bg')}/5 border ${getColorClass(currentConfig.color, 'border')}/20 rounded p-3`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Fingerprint size={14} className={getColorClass(currentConfig.color, 'text')} />
                        </motion.div>
                        <span className={`text-[10px] font-mono ${getColorClass(currentConfig.color, 'text')} animate-pulse`}>
                          {authSteps[authStep]}
                        </span>
                      </div>
                      <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${((authStep + 1) / authSteps.length) * 100}%` }}
                          className="h-full bg-gradient-to-r from-cyan to-neon rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded border ${getColorClass(currentConfig.color, 'border')}/40 ${getColorClass(currentConfig.color, 'bg')}/15 ${getColorClass(currentConfig.color, 'text')} font-mono font-bold text-sm uppercase tracking-wider hover:brightness-125 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  style={{}}

                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Radio size={16} />
                      </motion.div>
                      {role === 'guest' ? 'Sending Link...' : 'Authenticating...'}
                    </>
                  ) : (
                    <>
                      {currentConfig.icon}
                      {role === 'guest' ? 'Send Verification Link' : `Authenticate as ${currentConfig.label}`}
                    </>
                  )}
                </motion.button>
              </>
            )}

            {/* Demo credentials */}
            {!otpSent && (
              <div className="border-t border-border-dim pt-4 mt-4">
                <p className="text-[8px] font-mono text-text-dim uppercase tracking-wider text-center mb-2">
                  Quick Demo Access (from users.ts database)
                </p>
                <div className="grid grid-cols-4 gap-2 text-[7px] font-mono">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('citizen')}
                    className="bg-bg-primary border border-border-dim rounded p-2 hover:border-neon/30 transition-all text-center"
                  >
                    <User size={12} className="text-neon mx-auto mb-1" />
                    <span className="text-neon block">Citizen</span>
                    <span className="text-text-dim">{demoCredentials.citizen.rrNumber}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('driver')}
                    className="bg-bg-primary border border-border-dim rounded p-2 hover:border-amber/30 transition-all text-center"
                  >
                    <Truck size={12} className="text-amber mx-auto mb-1" />
                    <span className="text-amber block">Driver</span>
                    <span className="text-text-dim">{demoCredentials.driver.driverId}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="bg-bg-primary border border-border-dim rounded p-2 hover:border-cyan/30 transition-all text-center"
                  >
                    <Shield size={12} className="text-cyan mx-auto mb-1" />
                    <span className="text-cyan block">BWSSB Mgr</span>
                    <span className="text-text-dim">{demoCredentials.admin.adminId}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('guest')}
                    className="bg-bg-primary border border-border-dim rounded p-2 hover:border-text-secondary/30 transition-all text-center"
                  >
                    <Globe size={12} className="text-text-secondary mx-auto mb-1" />
                    <span className="text-text-secondary block">Guest</span>
                    <span className="text-text-dim">OTP</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[8px] font-mono text-text-dim uppercase tracking-wider">
            Secured by AquaFlow Intelligence • 256-AES Encryption
          </p>
          <p className="text-[7px] font-mono text-text-dim mt-1">
            © 2024 BWSSB × AquaSphere AI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
