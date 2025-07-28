import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Star, StarOff, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

function speak(text, lang) {
  if (lang === 'tr-TR') {
    responsiveVoice.speak(text, "Turkish Female", { rate: 0.9 });
  } else if (lang === 'pt-PT') {
    responsiveVoice.speak(text, "Portuguese Female", { rate: 0.9 });
  } else {
    // Fallback for other languages
    responsiveVoice.speak(text, "English Female", { rate: 0.9 });
  }
}

const WordCard = ({ word, onMasteryChange, className }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteryLevel, setMasteryLevel] = useState(word.mastery_level || 0);

  const handleMasteryChange = (level) => {
    setMasteryLevel(level);
    onMasteryChange?.(word.id, level);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'badge-beginner';
      case 'intermediate': return 'badge-intermediate';
      case 'advanced': return 'badge-advanced';
      default: return 'badge-beginner';
    }
  };

  const masteryButtons = [
    { level: 1, icon: XCircle, color: 'text-red-500', label: 'Don\'t know' },
    { level: 2, icon: XCircle, color: 'text-orange-500', label: 'Hard' },
    { level: 3, icon: Star, color: 'text-yellow-500', label: 'Good' },
    { level: 4, icon: Star, color: 'text-blue-500', label: 'Easy' },
    { level: 5, icon: CheckCircle, color: 'text-green-500', label: 'Mastered' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('card-hover', className)}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {word.source_word}
              <button
                className="ml-2 p-1 text-gray-400 hover:text-primary-600"
                aria-label="Listen to word"
                onClick={() => speak(word.source_word, 'tr-TR')}
              >
                <Volume2 size={18} />
              </button>
            </h3>
            {word.pronunciation && (
              <p className="text-sm text-gray-500 italic">
                {word.pronunciation}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={getDifficultyColor(word.difficulty)}>
              {word.difficulty}
            </span>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showTranslation ? 'Hide translation' : 'Show translation'}
            >
              {showTranslation ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Translation */}
        <AnimatePresence mode="wait">
          {showTranslation ? (
            <motion.div
              key="translation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-primary-50 rounded-lg p-4"
            >
              <div className="text-xl font-semibold text-primary-700 flex items-center">
                {word.target_word}
                <button
                  className="ml-2 p-1 text-primary-400 hover:text-primary-700"
                  aria-label="Listen to translation"
                  onClick={() => speak(word.target_word, 'pt-PT')}
                >
                  <Volume2 size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-100 rounded-lg p-4 text-center"
            >
              <p className="text-gray-500 text-sm">
                Click the eye icon to reveal translation
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Examples Section */}
      <div className="p-6 space-y-4">
        {word.source_example && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Example
              </span>
              <button
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Listen to example"
                onClick={() => speak(word.source_example, 'tr-TR')}
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-gray-900 leading-relaxed">
              {word.source_example}
            </p>
          </div>
        )}

        {showTranslation && word.target_example && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                Exemplo
              </span>
              <button
                className="p-1 text-primary-400 hover:text-primary-600 transition-colors"
                aria-label="Listen to example"
                onClick={() => speak(word.target_example, 'pt-PT')}
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-primary-900 leading-relaxed">
              {word.target_example}
            </p>
          </motion.div>
        )}
      </div>

      {/* Mastery Section */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            How well do you know this word?
          </h4>
          <div className="flex flex-wrap gap-2">
            {masteryButtons.map(({ level, icon: Icon, color, label }) => (
              <button
                key={level}
                onClick={() => handleMasteryChange(level)}
                className={cn(
                  'flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  masteryLevel === level
                    ? 'bg-white shadow-md ring-2 ring-primary-500'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                )}
                aria-label={label}
              >
                <Icon 
                  size={16} 
                  className={cn(
                    color,
                    masteryLevel === level ? 'text-primary-600' : 'text-gray-400'
                  )} 
                />
                <span className={cn(
                  masteryLevel === level ? 'text-primary-700' : 'text-gray-600'
                )}>
                  {level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Mastery Level: {masteryLevel}/5</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-2 h-2 rounded-full',
                  level <= masteryLevel ? 'bg-primary-500' : 'bg-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WordCard; 