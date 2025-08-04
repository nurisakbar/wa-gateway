import { defineNuxtPlugin } from '#app'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js'

export default defineNuxtPlugin(() => {
  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend
  )

  // Configure global Chart.js options
  ChartJS.defaults.font.family = 'Inter, sans-serif'
  ChartJS.defaults.color = '#6c757d'
  ChartJS.defaults.plugins.legend.position = 'top'
  ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  ChartJS.defaults.plugins.tooltip.titleColor = '#ffffff'
  ChartJS.defaults.plugins.tooltip.bodyColor = '#ffffff'
  ChartJS.defaults.plugins.tooltip.borderColor = '#25D366'
  ChartJS.defaults.plugins.tooltip.borderWidth = 1
  ChartJS.defaults.plugins.tooltip.cornerRadius = 8
  ChartJS.defaults.plugins.tooltip.displayColors = true
  ChartJS.defaults.plugins.tooltip.padding = 12
}) 