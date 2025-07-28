# Frontend Architecture for Language Learning Platform

## Technology Stack
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand or Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios or TanStack Query
- **UI Components**: Headless UI + Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Testing**: Vitest + React Testing Library
- **PWA**: Service Workers for offline support

## Project Structure
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Layout components
│   ├── auth/               # Authentication components
│   ├── words/              # Word-related components
│   ├── progress/           # Progress tracking components
│   └── email/              # Email subscription components
├── hooks/                  # Custom React hooks
├── services/               # API services
├── stores/                 # State management
├── utils/                  # Utility functions
├── types/                  # TypeScript types
├── styles/                 # Global styles
└── pages/                  # Page components
```

## Responsive Design Strategy

### 1. Mobile-First Approach
```css
/* Base styles (mobile) */
.container {
  padding: 1rem;
  max-width: 100%;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 768px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1024px;
  }
}
```

### 2. Breakpoint System
```javascript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
```

### 3. Responsive Grid System
```jsx
// Word cards grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {words.map(word => <WordCard key={word.id} word={word} />)}
</div>
```

## Core Components

### 1. Responsive Navigation
```jsx
const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/words">Today's Words</NavLink>
            <NavLink to="/progress">Progress</NavLink>
            <UserMenu />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <MobileNavLink to="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink to="/words">Today's Words</MobileNavLink>
              <MobileNavLink to="/progress">Progress</MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
```

### 2. Word Card Component
```jsx
const WordCard = ({ word, onMasteryChange }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Word Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {word.source_word}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {word.pronunciation}
            </p>
          </div>
          <DifficultyBadge level={word.difficulty} />
        </div>
      </div>
      
      {/* Word Content */}
      <div className="p-4">
        {/* Translation */}
        <div className="mb-4">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-left w-full"
          >
            <div className="text-lg font-medium text-gray-700">
              {showTranslation ? word.target_word : '••••••'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Click to {showTranslation ? 'hide' : 'show'} translation
            </div>
          </button>
        </div>
        
        {/* Examples */}
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600 mb-1">Example:</p>
            <p className="text-gray-900">{word.source_example}</p>
          </div>
          {showTranslation && (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600 mb-1">Exemplo:</p>
              <p className="text-gray-900">{word.target_example}</p>
            </div>
          )}
        </div>
        
        {/* Mastery Controls */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">How well do you know this word?</span>
            <MasteryButtons
              currentLevel={word.mastery_level}
              onLevelChange={onMasteryChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3. Progress Dashboard
```jsx
const ProgressDashboard = () => {
  const { progress } = useProgress();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Words"
          value={progress.total_words}
          icon={BookOpenIcon}
          color="blue"
        />
        <StatCard
          title="Mastered"
          value={progress.mastered_words}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Learning Streak"
          value={progress.streak_days}
          icon={FireIcon}
          color="orange"
        />
        <StatCard
          title="Due for Review"
          value={progress.words_due_review}
          icon={ClockIcon}
          color="red"
        />
      </div>
      
      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
          <ProgressChart data={progress.weekly_data} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Mastery Distribution</h3>
          <MasteryChart data={progress.mastery_distribution} />
        </div>
      </div>
    </div>
  );
};
```

### 4. Email Subscription Modal
```jsx
const EmailSubscriptionModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    frequency: 'daily',
    time: '09:00',
    words_per_day: 5
  });
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          Get Daily Words in Your Email
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={preferences.frequency}
              onChange={(e) => setPreferences({...preferences, frequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Words per Day
            </label>
            <select
              value={preferences.words_per_day}
              onChange={(e) => setPreferences({...preferences, words_per_day: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 words</option>
              <option value={5}>5 words</option>
              <option value={10}>10 words</option>
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Subscribe
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
```

## State Management

### Zustand Store Structure
```javascript
// stores/wordStore.js
import { create } from 'zustand';

export const useWordStore = create((set, get) => ({
  // State
  dailyWords: [],
  userProgress: {},
  isLoading: false,
  error: null,
  
  // Actions
  fetchDailyWords: async (date) => {
    set({ isLoading: true });
    try {
      const words = await wordService.getDailyWords(date);
      set({ dailyWords: words, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateWordMastery: async (wordId, masteryLevel) => {
    try {
      await wordService.updateMastery(wordId, masteryLevel);
      set(state => ({
        userProgress: {
          ...state.userProgress,
          [wordId]: masteryLevel
        }
      }));
    } catch (error) {
      set({ error: error.message });
    }
  }
}));
```

## PWA Features

### Service Worker
```javascript
// public/sw.js
const CACHE_NAME = 'language-learning-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## Performance Optimization

### 1. Code Splitting
```javascript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));

// Route-based code splitting
<Routes>
  <Route path="/dashboard" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
  <Route path="/progress" element={<Suspense fallback={<Loading />}><Progress /></Suspense>} />
</Routes>
```

### 2. Image Optimization
```jsx
// Responsive images
<img
  srcSet={`${imagePath}-300w.jpg 300w, ${imagePath}-600w.jpg 600w, ${imagePath}-900w.jpg 900w`}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src={`${imagePath}-600w.jpg`}
  alt="Word illustration"
  loading="lazy"
/>
```

### 3. Virtual Scrolling for Large Lists
```jsx
import { FixedSizeList as List } from 'react-window';

const WordList = ({ words }) => (
  <List
    height={600}
    itemCount={words.length}
    itemSize={120}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <WordCard word={words[index]} />
      </div>
    )}
  </List>
);
```

## Accessibility Features

### 1. Keyboard Navigation
```jsx
const WordCard = ({ word }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsFlipped(!isFlipped);
    }
  };
  
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setIsFlipped(!isFlipped)}
      aria-label={`Flip card to see ${isFlipped ? 'original' : 'translation'}`}
    >
      {/* Card content */}
    </div>
  );
};
```

### 2. Screen Reader Support
```jsx
// Progress announcements
const ProgressAnnouncement = ({ progress }) => (
  <div aria-live="polite" className="sr-only">
    You have mastered {progress.mastered_words} out of {progress.total_words} words.
  </div>
);
```

## Testing Strategy

### Component Testing
```javascript
// components/WordCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WordCard } from './WordCard';

test('shows word and hides translation initially', () => {
  const word = {
    source_word: 'elma',
    target_word: 'maçã',
    source_example: 'Ben bir elma yiyorum.'
  };
  
  render(<WordCard word={word} />);
  
  expect(screen.getByText('elma')).toBeInTheDocument();
  expect(screen.queryByText('maçã')).not.toBeInTheDocument();
});

test('shows translation when clicked', () => {
  const word = {
    source_word: 'elma',
    target_word: 'maçã',
    source_example: 'Ben bir elma yiyorum.'
  };
  
  render(<WordCard word={word} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('maçã')).toBeInTheDocument();
});
```

## Deployment Configuration

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Language Learning Platform',
        short_name: 'LangLearn',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@radix-ui/react-dialog']
        }
      }
    }
  }
});
``` 