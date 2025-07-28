import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Flame, 
  Clock, 
  TrendingUp, 
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { cn } from '../utils/cn';

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card-hover p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={cn(
                "w-4 h-4 mr-1",
                trend > 0 ? "text-success-500" : "text-danger-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-success-600" : "text-danger-600"
              )}>
                {trend > 0 ? '+' : ''}{trend}% this week
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          color === 'blue' && "bg-primary-100",
          color === 'green' && "bg-success-100",
          color === 'orange' && "bg-warning-100",
          color === 'red' && "bg-danger-100"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            color === 'blue' && "text-primary-600",
            color === 'green' && "text-success-600",
            color === 'orange' && "text-warning-600",
            color === 'red' && "text-danger-600"
          )} />
        </div>
      </div>
    </motion.div>
  );
};

const ProgressChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.day} className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600 w-12">
            {item.day}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-primary-500 h-2 rounded-full"
            />
          </div>
          <span className="text-sm font-medium text-gray-900 w-8 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const AchievementCard = ({ achievement }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200"
    >
      <div className="p-2 bg-primary-500 rounded-lg mr-4">
        <Award className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-medium text-primary-900">{achievement.title}</h4>
        <p className="text-sm text-primary-700">{achievement.description}</p>
      </div>
    </motion.div>
  );
};

const ProgressDashboard = ({ progress }) => {
  // Mock data - replace with real data from API
  const mockProgress = {
    total_words: 150,
    mastered_words: 45,
    streak_days: 7,
    words_due_review: 12,
    weekly_data: [
      { day: 'Mon', value: 5 },
      { day: 'Tue', value: 8 },
      { day: 'Wed', value: 6 },
      { day: 'Thu', value: 10 },
      { day: 'Fri', value: 7 },
      { day: 'Sat', value: 4 },
      { day: 'Sun', value: 9 }
    ],
    achievements: [
      {
        title: '7-Day Streak',
        description: 'You\'ve been learning for 7 days in a row!'
      },
      {
        title: '50 Words Mastered',
        description: 'You\'ve mastered 50 words in your learning journey'
      }
    ]
  };

  const data = progress || mockProgress;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Learning Progress
        </h1>
        <p className="text-gray-600">
          Track your language learning journey and celebrate your achievements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Words"
          value={data.total_words}
          icon={BookOpen}
          color="blue"
          trend={12}
        />
        <StatCard
          title="Mastered"
          value={data.mastered_words}
          icon={CheckCircle}
          color="green"
          trend={8}
        />
        <StatCard
          title="Learning Streak"
          value={data.streak_days}
          icon={Flame}
          color="orange"
          subtitle="days"
        />
        <StatCard
          title="Due for Review"
          value={data.words_due_review}
          icon={Clock}
          color="red"
        />
      </div>

      {/* Charts and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Progress Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </div>
          <ProgressChart data={data.weekly_data} />
        </div>

        {/* Achievements */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
            <Award className="w-5 h-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            {data.achievements.map((achievement, index) => (
              <AchievementCard 
                key={index} 
                achievement={achievement} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Learning Goals */}
      <div className="mt-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${(data.mastered_words / 100) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round((data.mastered_words / 100) * 100)}%
                  </span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900">100 Words Goal</h4>
              <p className="text-sm text-gray-500">{data.mastered_words}/100 words</p>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={`${(data.streak_days / 30) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round((data.streak_days / 30) * 100)}%
                  </span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900">30-Day Streak</h4>
              <p className="text-sm text-gray-500">{data.streak_days}/30 days</p>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="70, 100"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">70%</span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900">Perfect Week</h4>
              <p className="text-sm text-gray-500">5/7 days completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard; 