import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const EmailSubscriptionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    frequency: 'daily',
    wordsPerDay: 5,
    time: '09:00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate email
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ email: '', frequency: 'daily', wordsPerDay: 5, time: '09:00' });
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Get Daily Words
                  </h2>
                  <p className="text-sm text-gray-500">
                    Never miss a learning opportunity
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-success-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Successfully Subscribed!
                  </h3>
                  <p className="text-gray-600">
                    You'll start receiving daily words in your inbox.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={cn(
                        'input',
                        error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
                      )}
                      placeholder="your@email.com"
                      required
                    />
                    {error && (
                      <div className="flex items-center mt-2 text-sm text-danger-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Frequency Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'daily', label: 'Daily', icon: Calendar },
                        { value: 'weekly', label: 'Weekly', icon: Calendar },
                        { value: 'monthly', label: 'Monthly', icon: Calendar }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleInputChange('frequency', value)}
                          className={cn(
                            'flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200',
                            formData.frequency === value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          )}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Words per Day */}
                  <div>
                    <label htmlFor="wordsPerDay" className="block text-sm font-medium text-gray-700 mb-2">
                      Words per Day
                    </label>
                    <select
                      id="wordsPerDay"
                      value={formData.wordsPerDay}
                      onChange={(e) => handleInputChange('wordsPerDay', parseInt(e.target.value))}
                      className="select"
                    >
                      <option value={3}>3 words</option>
                      <option value={5}>5 words</option>
                      <option value={10}>10 words</option>
                      <option value={15}>15 words</option>
                    </select>
                  </div>

                  {/* Delivery Time */}
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        id="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">What you'll get:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                        Personalized daily word sets
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                        Example sentences in both languages
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                        Progress tracking and spaced repetition
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
                        Easy unsubscribe anytime
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-3 text-base font-medium"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Subscribing...
                      </div>
                    ) : (
                      'Subscribe to Daily Words'
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default EmailSubscriptionModal; 