import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Mail, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Globe,
  Target,
  Zap
} from 'lucide-react';
import WordCard from './components/WordCard';
import EmailSubscriptionModal from './components/EmailSubscriptionModal';
import ProgressDashboard from './components/ProgressDashboard';
import { cn } from './utils/cn';
import './App.css';

const levels = ['beginner', 'intermediate', 'advanced'];
const languages = [
  { code: 'tr', label: 'Turkish' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Portuguese' },
];

function App() {
  const [level, setLevel] = useState('beginner');
  const [sourceLang, setSourceLang] = useState('tr');
  const [targetLang, setTargetLang] = useState('pt');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent selecting the same language for source and target
  const availableTargetLangs = languages.filter(l => l.code !== sourceLang);

  // Fetch words from backend API
  const fetchWords = async (level, source, target) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/words?level=${level}&source=${source}&target=${target}&count=5`);
      const data = await response.json();
      setWords(data.words || []);
    } catch (err) {
      console.error('Error fetching words:', err);
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords(level, sourceLang, targetLang);
    // eslint-disable-next-line
  }, [level, sourceLang, targetLang]);

  // New Day: force new set of words
  const handleNewDay = () => {
    fetchWords(level, sourceLang, targetLang);
  };

  const handleMasteryChange = (wordId, masteryLevel) => {
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === wordId 
          ? { ...word, mastery_level: masteryLevel }
          : word
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading words...</h2>
          <p className="text-gray-600 mt-2">Preparing your daily words</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Globe className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LangLearn</h1>
                <p className="text-xs text-gray-500">Multi-language Vocabulary</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setShowProgress(!showProgress)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  showProgress 
                    ? "bg-primary-100 text-primary-700" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="btn-primary"
              >
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-gray-200"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <button
                    onClick={() => {
                      setShowProgress(!showProgress);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium",
                      showProgress 
                        ? "bg-primary-100 text-primary-700" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Progress</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full btn-primary"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Subscribe to Emails
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {showProgress ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProgressDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="words"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Daily Language Learning
                    </h1>
                    <p className="text-gray-600">
                      Expand your vocabulary with personalized daily word sets
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="btn-primary"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Get Daily Emails
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-3">
                    <label htmlFor="source-lang-select" className="text-sm font-medium text-gray-700">
                      From:
                    </label>
                    <select
                      id="source-lang-select"
                      value={sourceLang}
                      onChange={e => {
                        setSourceLang(e.target.value);
                        // If target is the same, auto-switch target
                        if (e.target.value === targetLang) {
                          const next = languages.find(l => l.code !== e.target.value);
                          setTargetLang(next.code);
                        }
                      }}
                      className="select w-auto"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.label}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">→</span>
                    <label htmlFor="target-lang-select" className="text-sm font-medium text-gray-700">
                      To:
                    </label>
                    <select
                      id="target-lang-select"
                      value={targetLang}
                      onChange={e => setTargetLang(e.target.value)}
                      className="select w-auto"
                    >
                      {availableTargetLangs.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label htmlFor="level-select" className="text-sm font-medium text-gray-700">
                      Difficulty:
                    </label>
                    <select
                      id="level-select"
                      value={level}
                      onChange={e => setLevel(e.target.value)}
                      className="select w-auto"
                    >
                      {levels.map(lvl => (
                        <option key={lvl} value={lvl}>
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleNewDay}
                    className="btn-secondary"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    New Day
                  </button>
                </div>
              </div>

              {/* Words Grid */}
              {words.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {words.map((word, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <WordCard
                        word={word}
                        onMasteryChange={handleMasteryChange}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {words.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No words available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try changing the language pair, difficulty level, or generating new words.
                  </p>
                  <button
                    onClick={handleNewDay}
                    className="btn-primary"
                  >
                    Generate New Words
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Email Subscription Modal */}
      <EmailSubscriptionModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}

export default App;
