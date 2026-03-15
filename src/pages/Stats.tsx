import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart,
  Scatter, Tooltip, Cell, CartesianGrid, ScatterChart
} from 'recharts';
import {
  Target, CheckCircle2, BookOpen, Trophy, Star, Award,
  Medal, BookMarked, TrendingUp, Activity, BarChart3,
  Home, RotateCcw, AlertCircle
, Swords} from 'lucide-react';

interface StatsEntry {
  attempts: number;
  correct: number;
  lastPracticed: string;
}

interface StatsData {
  openings: {
    [key: string]: StatsEntry;
  };
  lines: {
    [key: string]: StatsEntry;
  };
  hasUploadedFile: boolean;
}

const Stats = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<'selection' | 'openings' | 'lines'>('selection');
  const [showCurtains, setShowCurtains] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // COMPLETELY LOCK SCROLLING - No black space
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Load stats from storage
  useEffect(() => {
    const loadStats = () => {
      try {
        const stored = localStorage.getItem('chessStats');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('✅ Stats loaded successfully:', parsed);
          setStatsData(parsed);
        } else {
          console.log('⚠️ No stats found in localStorage');
          setStatsData({
            openings: {},
            lines: {},
            hasUploadedFile: false
          });
        }
      } catch (error) {
        console.error('❌ Error loading stats:', error);
        setStatsData({
          openings: {},
          lines: {},
          hasUploadedFile: false
        });
      }
    };
    loadStats();
  }, []);

  const calculateAccuracy = (correct: number, attempts: number): number => {
    if (attempts === 0) return 0;
    return Math.round((correct / attempts) * 100);
  };

  const handleResetStats = () => {
    const isOpeningsView = selectedView === 'openings';
    const stats = statsData!;

    if (isOpeningsView) {
      stats.openings = {};
    } else {
      stats.lines = {};
    }

    localStorage.setItem('chessStats', JSON.stringify(stats));
    setStatsData({ ...stats });
    setShowResetConfirm(false);

    // Go back to selection after reset
    setTimeout(() => {
      setShowDashboard(false);
      setShowCurtains(false);
      setSelectedView('selection');
    }, 500);
  };

  const getMedalForStats = (accuracy: number, attempts: number) => {
    if (attempts === 0) return { icon: Target, name: 'No Attempts', color: '#9CA3AF' };
    if (accuracy >= 95 && attempts >= 100) return { icon: Trophy, name: 'Diamond Master', color: '#00D4FF' };
    if (accuracy >= 90 && attempts >= 75) return { icon: Star, name: 'Platinum Pro', color: '#A78BFA' };
    if (accuracy >= 80 && attempts >= 50) return { icon: Award, name: 'Gold Champion', color: '#FBBF24' };
    if (accuracy >= 65 && attempts >= 25) return { icon: Medal, name: 'Silver Expert', color: '#94A3B8' };
    if (accuracy >= 50 && attempts >= 10) return { icon: Award, name: 'Bronze Scholar', color: '#F59E0B' };
    return { icon: BookMarked, name: 'Beginner', color: '#6B7280' };
  };

  // Chart type rotation - NO PIE CHARTS, NO RADIAL - Only bar, scatter, line charts
  const getChartType = (index: number): 'horizontal-bar' | 'vertical-bar' | 'grouped-bar' | 'scatter' | 'line' | 'area' | 'stacked-area' | 'multi-line' => {
    const types: ('horizontal-bar' | 'vertical-bar' | 'grouped-bar' | 'scatter' | 'line' | 'area' | 'stacked-area' | 'multi-line')[] =
      ['horizontal-bar', 'vertical-bar', 'grouped-bar', 'scatter', 'line', 'area', 'stacked-area', 'multi-line'];
    return types[index % types.length];
  };

  // Animation directions - EXTREME DISTANCES for VERY VISIBLE movement
  const getAnimationDirection = (index: number, total: number) => {
    const position = index % 16;

    // EXTREME distances from far beyond screen edges
    const directions = [
      { x: -2000, y: -1500 },  // Far far top-left
      { x: -1000, y: -2000 },  // Far far top-left-center
      { x: 0, y: -2000 },      // Far far top
      { x: 1000, y: -2000 },   // Far far top-right-center
      { x: 2000, y: -1500 },   // Far far top-right
      { x: 2000, y: -500 },    // Far right-upper
      { x: 2000, y: 500 },     // Far right-lower
      { x: 2000, y: 1500 },    // Far far bottom-right
      { x: 1000, y: 2000 },    // Far far bottom-right-center
      { x: 0, y: 2000 },       // Far far bottom
      { x: -1000, y: 2000 },   // Far far bottom-left-center
      { x: -2000, y: 1500 },   // Far far bottom-left
      { x: -2000, y: 500 },    // Far left-lower
      { x: -2000, y: -500 },   // Far left-upper
      { x: -1500, y: 0 },      // Far left-center
      { x: 1500, y: 0 },       // Far right-center
    ];

    return directions[position];
  };

  // ============ CHART COMPONENTS ============

  // 1. Horizontal Bar Chart - Attempts vs Correct
  const HorizontalBarChart = ({ attempts, correct, color }: { attempts: number; correct: number; color: string }) => {
    const data = [
      { name: 'Correct', value: correct, fill: color },
      { name: 'Wrong', value: attempts - correct, fill: '#FCA5A5' }
    ];

    return (
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} width={60} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 2. Vertical Bar Chart - Performance Comparison
  const VerticalBarChart = ({ attempts, correct, color }: { attempts: number; correct: number; color: string }) => {
    const data = [
      { name: 'Total', value: attempts, fill: '#E5E7EB' },
      { name: 'Correct', value: correct, fill: color },
      { name: 'Wrong', value: attempts - correct, fill: '#FCA5A5' }
    ];

    return (
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
          <YAxis stroke="#9CA3AF" fontSize={11} />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 3. Grouped Bar Chart
  const GroupedBarChart = ({ attempts, correct, color }: { attempts: number; correct: number; color: string }) => {
    const accuracy = calculateAccuracy(correct, attempts);
    const data = [
      { category: 'Performance', attempts: attempts, correct: correct, accuracy: accuracy }
    ];

    return (
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="category" stroke="#9CA3AF" fontSize={11} />
          <YAxis stroke="#9CA3AF" fontSize={11} />
          <Tooltip />
          <Bar dataKey="attempts" fill="#CBD5E1" radius={[6, 6, 0, 0]} animationDuration={1500} />
          <Bar dataKey="correct" fill={color} radius={[6, 6, 0, 0]} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 4. Scatter Plot - Accuracy vs Attempts
  const ScatterPlotChart = ({ accuracy, attempts, color }: { accuracy: number; attempts: number; color: string }) => {
    // Create realistic scatter data showing improvement trajectory
    const data = Array.from({ length: 12 }, (_, i) => {
      const progress = i / 11;
      const baseAttempts = Math.floor(attempts * (0.1 + progress * 0.9));
      const baseAccuracy = Math.max(30, Math.min(100, accuracy - (11 - i) * 6 + (Math.random() - 0.5) * 8));

      return {
        attempts: baseAttempts,
        accuracy: baseAccuracy,
        size: i === 11 ? 800 : 150 + Math.random() * 200
      };
    });

    return (
      <ResponsiveContainer width="100%" height={140}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" dataKey="attempts" name="Attempts" stroke="#9CA3AF" fontSize={10} />
          <YAxis type="number" dataKey="accuracy" name="Accuracy" domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Progress" data={data} fill={color} animationDuration={1800}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === data.length - 1 ? color : `${color}60`}
                opacity={index === data.length - 1 ? 1 : 0.4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // 5. Line Chart - Progress Trajectory
  const LineChartComponent = ({ accuracy, color }: { accuracy: number; color: string }) => {
    // Simulate learning curve
    const data = Array.from({ length: 15 }, (_, i) => ({
      session: i + 1,
      performance: Math.max(30, Math.min(100, accuracy - (15 - i) * 5 + (Math.random() - 0.5) * 6)),
    }));

    return (
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="session" stroke="#9CA3AF" fontSize={10} />
          <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="performance"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // 6. Area Chart - Performance Distribution
  const AreaChartComponent = ({ accuracy, color }: { accuracy: number; color: string }) => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      point: i + 1,
      value: Math.max(20, Math.min(100, accuracy - (12 - i) * 4 + (Math.random() - 0.5) * 8)),
    }));

    return (
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="point" stroke="#9CA3AF" fontSize={10} />
          <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.3}
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // 7. Stacked Area Chart - Cumulative Progress
  const StackedAreaChart = ({ attempts, correct, color }: { attempts: number; correct: number; color: string }) => {
    const data = Array.from({ length: 10 }, (_, i) => {
      const progress = (i + 1) / 10;
      return {
        session: i + 1,
        correct: Math.floor(correct * progress),
        wrong: Math.floor((attempts - correct) * progress),
      };
    });

    return (
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="session" stroke="#9CA3AF" fontSize={10} />
          <YAxis stroke="#9CA3AF" fontSize={10} />
          <Tooltip />
          <Area type="monotone" dataKey="correct" stackId="1" stroke={color} fill={color} animationDuration={1800} />
          <Area type="monotone" dataKey="wrong" stackId="1" stroke="#FCA5A5" fill="#FCA5A5" animationDuration={1800} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // 8. Multi-Line Chart - Comparative Analysis
  const MultiLineChart = ({ accuracy, attempts, correct, color }: { accuracy: number; attempts: number; correct: number; color: string }) => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      point: i + 1,
      accuracy: Math.max(20, Math.min(100, accuracy - (12 - i) * 4 + (Math.random() - 0.5) * 6)),
      target: 85 + Math.random() * 10,
    }));

    return (
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="point" stroke="#9CA3AF" fontSize={10} />
          <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 3 }}
            animationDuration={2000}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#94A3B8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Individual Chart Card Component with EXTREME ANIMATIONS
  const ChartCard = ({
    name,
    stats,
    index,
    total
  }: {
    name: string;
    stats: StatsEntry;
    index: number;
    total: number;
  }) => {
    const accuracy = calculateAccuracy(stats.correct, stats.attempts);
    const medal = getMedalForStats(accuracy, stats.attempts);
    const MedalIcon = medal.icon;
    const chartType = getChartType(index);
    const direction = getAnimationDirection(index, total);

    // VERY LONG delays - each card gets 0.5s to be noticed individually
    const delay = 1.2 + (index * 2);

    return (
      <motion.div
        initial={{
          x: direction.x,
          y: direction.y,
          opacity: 0,
          scale: 0.2,
          rotate: direction.x > 0 ? 45 : -45,
        }}
        animate={{
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          rotate: 0,
        }}
        transition={{
          delay,
          duration: 1.8,  // VERY SLOW for dramatic effect
          type: "spring",
          stiffness: 40,  // VERY SOFT spring = more visible movement
          damping: 15,
        }}
        whileHover={{
          scale: 1.08,
          y: -15,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          transition: { duration: 0.3 }
        }}
        className="bg-white rounded-2xl p-4 sm:p-6 relative overflow-hidden group cursor-pointer border border-gray-100"
        style={{
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Colored accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: medal.color }}
        />

        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-15"
          style={{ backgroundColor: medal.color }}
          initial={false}
          transition={{ duration: 0.4 }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-5">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2 truncate leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-2">
              <MedalIcon className="w-6 h-6" style={{ color: medal.color }} />
              <span className="text-xs text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded">
                {medal.name}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg font-mono">
            #{index + 1}
          </div>
        </div>

        {/* Chart */}
        <div className="mb-3 sm:mb-5 bg-gray-50 rounded-xl p-2 sm:p-3">
          {chartType === 'horizontal-bar' && <HorizontalBarChart attempts={stats.attempts} correct={stats.correct} color={medal.color} />}
          {chartType === 'vertical-bar' && <VerticalBarChart attempts={stats.attempts} correct={stats.correct} color={medal.color} />}
          {chartType === 'grouped-bar' && <GroupedBarChart attempts={stats.attempts} correct={stats.correct} color={medal.color} />}
          {chartType === 'scatter' && <ScatterPlotChart accuracy={accuracy} attempts={stats.attempts} color={medal.color} />}
          {chartType === 'line' && <LineChartComponent accuracy={accuracy} color={medal.color} />}
          {chartType === 'area' && <AreaChartComponent accuracy={accuracy} color={medal.color} />}
          {chartType === 'stacked-area' && <StackedAreaChart attempts={stats.attempts} correct={stats.correct} color={medal.color} />}
          {chartType === 'multi-line' && <MultiLineChart accuracy={accuracy} attempts={stats.attempts} correct={stats.correct} color={medal.color} />}
        </div>

        {/* Chart Type Label */}
        <div className="text-xs text-gray-500 mb-3 sm:mb-4 text-center font-medium uppercase tracking-wider bg-gray-100 py-1.5 rounded">
          {chartType === 'horizontal-bar' && '━ Horizontal Bar Chart'}
          {chartType === 'vertical-bar' && '▬ Vertical Bar Chart'}
          {chartType === 'grouped-bar' && '▬▬ Grouped Bar Chart'}
          {chartType === 'scatter' && '● Scatter Plot Analysis'}
          {chartType === 'line' && '╱ Trend Line Projection'}
          {chartType === 'area' && '▁ Area Distribution'}
          {chartType === 'stacked-area' && '▁▁ Cumulative Area'}
          {chartType === 'multi-line' && '╱╱ Multi-Line Comparison'}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="text-center bg-gray-50 rounded-lg p-2 sm:p-2.5">
            <div className="text-xs text-gray-500 mb-1 font-medium">Accuracy</div>
            <div className="text-base sm:text-xl font-bold" style={{ color: medal.color }}>
              {accuracy}%
            </div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2 sm:p-2.5">
            <div className="text-xs text-gray-500 mb-1 font-medium">Attempts</div>
            <div className="text-base sm:text-xl font-bold text-gray-700">
              {stats.attempts}
            </div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2 sm:p-2.5">
            <div className="text-xs text-gray-500 mb-1 font-medium">Correct</div>
            <div className="text-base sm:text-xl font-bold text-emerald-600">
              {stats.correct}
            </div>
          </div>
        </div>

        {/* Hover effect indicator */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: medal.color }}
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    );
  };

  const renderCurtains = () => {
    return (
      <>
        {/* Left Curtain */}
        <motion.div
          className="fixed inset-0 z-50 bg-purple-800 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        {/* Right Curtain */}
        <motion.div
          className="fixed inset-0 z-50 bg-purple-800 origin-right"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          onAnimationComplete={() => {
            setTimeout(() => {
              setShowDashboard(true);
            }, 500);
          }}
        />
        {/* Center Text */}
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex justify-center mb-4"
            >
              <BarChart3 className="w-20 h-20 text-white" />
            </motion.div>
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Preparing Analytics
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-xl text-purple-200"
            >
              {selectedView === 'openings' ? 'Opening Performance Dashboard' : 'Lines Performance Dashboard'}
            </motion.p>
          </div>
        </motion.div>
      </>
    );
  };

  const renderSelectionScreen = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full mx-auto px-4"
      >
        <div className="text-center mb-6 sm:mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4 sm:mb-6"
          >
            <BarChart3 className="w-14 h-14 sm:w-24 sm:h-24 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-base sm:text-xl text-white/80 font-body">
            Choose your view to explore performance metrics
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedView('openings');
              setShowCurtains(true);
            }}
            className="bg-white rounded-2xl p-5 sm:p-8 text-left hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 group"
          >
            <div className="flex justify-start mb-3 sm:mb-4">
              <BookOpen className="w-10 h-10 sm:w-14 sm:h-14 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-display">Openings Dashboard</h3>
            <p className="text-gray-600 font-body">
              Analyze your performance across different chess openings
            </p>
            <div className="mt-6 flex items-center text-purple-600 font-semibold">
              View Analytics
              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedView('lines');
              setShowCurtains(true);
            }}
            className="bg-white rounded-2xl p-5 sm:p-8 text-left hover:shadow-2xl transition-all duration-300 border-2 border-pink-200 group"
          >
            <div className="flex justify-start mb-3 sm:mb-4">
              <Target className="w-10 h-10 sm:w-14 sm:h-14 text-pink-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-display">Lines Dashboard</h3>
            <p className="text-gray-600 font-body">
              Track your custom lines and training sequences
            </p>
            <div className="mt-6 flex items-center text-pink-600 font-semibold">
              View Analytics
              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderDashboard = () => {
    if (!statsData) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full mx-auto px-4"
        >
          <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-200 text-center">
            <div className="flex justify-center mb-4">
              <Activity className="w-16 h-16 text-purple-600 animate-pulse" />
            </div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Loading Analytics...
            </h3>
          </div>
        </motion.div>
      );
    }

    const isOpeningsView = selectedView === 'openings';
    const data = isOpeningsView ? statsData.openings : statsData.lines;
    const entries = Object.entries(data);
    const hasData = entries.length > 0;

    if (!hasData) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full mx-auto px-4"
        >
          <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-200 text-center">
            <div className="flex justify-center mb-4">
              <BarChart3 className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">
              No Data Available
            </h3>
            <p className="text-gray-600 font-body mb-6">
              Start practicing to see your analytics dashboard come to life!
            </p>
            <button
              onClick={() => navigate('/practice')}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:bg-purple-700 font-body mr-3"
            >
              Start Practicing
            </button>
            <button
              onClick={() => {
                setShowDashboard(false);
                setShowCurtains(false);
                setSelectedView('selection');
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-300 hover:bg-gray-300 font-body"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      );
    }

    const totalAttempts = entries.reduce((sum, [_, stats]) => sum + stats.attempts, 0);
    const totalCorrect = entries.reduce((sum, [_, stats]) => sum + stats.correct, 0);
    const overallAccuracy = calculateAccuracy(totalCorrect, totalAttempts);

    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
          {/* Dashboard Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-5 sm:mb-10"
          >
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-purple-600 mb-2 sm:mb-3">
              {isOpeningsView ? 'Opening Analytics Dashboard' : 'Lines Analytics Dashboard'}
            </h1>
            <p className="text-gray-600 font-body text-sm sm:text-lg">
              {entries.length} items tracked • {totalAttempts} total attempts • {overallAccuracy}% overall accuracy
            </p>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-10">
            <motion.div
              initial={{ x: -300, opacity: 0, rotate: -15 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 120 }}
              className="bg-blue-100 rounded-2xl p-3 sm:p-6 border border-blue-200"
              style={{ boxShadow: '0 8px 30px rgba(59, 130, 246, 0.2)' }}
            >
              <div className="flex justify-start mb-2 sm:mb-3">
                <Target className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">{totalAttempts}</div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold uppercase tracking-wide">Total Attempts</div>
            </motion.div>

            <motion.div
              initial={{ y: -300, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 120 }}
              className="bg-emerald-100 rounded-2xl p-3 sm:p-6 border border-emerald-200"
              style={{ boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)' }}
            >
              <div className="flex justify-start mb-2 sm:mb-3">
                <CheckCircle2 className="w-6 h-6 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">{overallAccuracy}%</div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold uppercase tracking-wide">Overall Accuracy</div>
            </motion.div>

            <motion.div
              initial={{ x: 300, opacity: 0, rotate: 15 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.6, duration: 1.0, type: "spring", stiffness: 60 }}
              className="bg-purple-100 rounded-2xl p-3 sm:p-6 border border-purple-200"
              style={{ boxShadow: '0 8px 30px rgba(168, 85, 247, 0.2)' }}
            >
              <div className="flex justify-start mb-2 sm:mb-3">
                <BookOpen className="w-6 h-6 sm:w-10 sm:h-10 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">{entries.length}</div>
              <div className="text-xs sm:text-sm text-gray-700 font-semibold uppercase tracking-wide">
                {isOpeningsView ? 'Openings' : 'Lines'} Tracked
              </div>
            </motion.div>
          </div>

          {/* Chart Cards Grid - SCROLLABLE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-10"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
              Individual Performance Models
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {entries.map(([name, stats], index) => (
                <ChartCard
                  key={name}
                  name={name}
                  stats={stats}
                  index={index}
                  total={entries.length}
                />
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
            className="text-center mt-8 sm:mt-12 pb-8 sm:pb-12"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={() => {
                  setShowDashboard(false);
                  setShowCurtains(false);
                  setSelectedView('selection');
                }}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-gray-800 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-gray-900 font-body flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Selection
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-red-700 font-body flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset {selectedView === 'openings' ? 'Openings' : 'Lines'} Stats
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-screen flex flex-col transition-colors duration-500"
      style={{
        background: showDashboard
          ? '#F8FAFC'  // Solid light gray-blue
          : '#8B5CF6'  // Solid purple
      }}
    >
      <header className="flex-shrink-0 flex items-center justify-between p-3 sm:p-6 relative z-[70]">
<div className="flex items-center gap-3">
  <button
    onClick={() => {
      if (showDashboard) {
        setShowDashboard(false);
        setShowCurtains(false);
        setSelectedView('selection');
      } else {
        navigate('/');
      }
    }}
    className={`flex items-center gap-2 transition-colors duration-300 font-body text-lg ${
      showDashboard
        ? 'text-gray-700 hover:text-gray-900'
        : 'text-white/90 hover:text-white'
    }`}
  >
    <span>←</span> {showDashboard ? 'Back' : 'Back to Home'}
  </button>

  <button
    onClick={() => navigate('/practice')}
    className={`flex items-center gap-2 transition-colors duration-300 font-body text-sm px-3 py-1.5 rounded-lg border ${
      showDashboard
        ? 'text-gray-700 hover:text-gray-900 border-gray-300 hover:bg-gray-100'
        : 'text-white/90 hover:text-white border-white/20 hover:bg-white/10'
    }`}
  >
    <Swords className="w-4 h-4" /> Practice
  </button>
</div>
        <div className="flex items-center gap-2">
          <span className="text-3xl">♔</span>
          <span className={`font-display font-bold text-base sm:text-xl ${
            showDashboard ? 'text-gray-900' : 'text-white'
          }`}>
            Chess Analytics
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedView === 'selection' && !showCurtains && renderSelectionScreen()}
          {showDashboard && renderDashboard()}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showCurtains && !showDashboard && renderCurtains()}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Reset {selectedView === 'openings' ? 'Openings' : 'Lines'} Statistics?
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                This will permanently delete all {selectedView === 'openings' ? 'opening' : 'line'} statistics.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStats}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stats;
