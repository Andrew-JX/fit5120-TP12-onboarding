<template>
  <div class="dashboard-page container">
    <div class="page-header fade-in">
      <h1>Dashboard</h1>
      <p class="sub">Your UV safety overview for today.</p>
    </div>

    <div class="dashboard-grid">
      
      <div class="card enhanced-card fade-in" v-if="uvStore.currentUv">
        <div class="card-header">
          <span class="header-icon">📍</span>
          <h3>Current UV Index</h3>
        </div>
        <p class="sub">{{ uvStore.currentUv.location }}</p>
        
        <div class="badge-wrapper">
          <UvBadge 
            :index="uvStore.currentUv.uvIndex"
            :level="uvStore.currentUv.advice.level"
            :color="uvStore.currentUv.advice.color"
            :emoji="uvStore.currentUv.advice.emoji"
          />
        </div>
      </div>
      <div class="card enhanced-card fade-in" v-else>
        <h3>Current UV Index</h3>
        <p class="sub">Loading...</p>
      </div>

      <div class="card enhanced-card fade-in" v-if="uvStore.currentUv">
        <div class="card-header">
          <span class="header-icon">🛡️</span>
          <h3>Protection Advice</h3>
        </div>
        <p class="risk-text" :style="{ color: uvStore.currentUv.advice.color }">
          <strong>{{ uvStore.currentUv.advice.risk }}</strong>
        </p>

        <ul class="advice-list">
          <li><span class="list-emoji">👕</span> <span><strong>Clothing:</strong> {{ uvStore.currentUv.advice.clothing }}</span></li>
          <li><span class="list-emoji">🧴</span> <span><strong>SPF:</strong> {{ uvStore.currentUv.advice.spf }}</span></li>
          <li><span class="list-emoji">🏃</span> <span><strong>Activity:</strong> {{ uvStore.currentUv.advice.activity }}</span></li>
          <li v-if="uvStore.currentUv.advice.timeWarning" class="warning-item">
            <span class="list-emoji">⚠️</span> <span><strong>Warning:</strong> {{ uvStore.currentUv.advice.timeWarning }}</span>
          </li>
        </ul>
      </div>
      <div class="card enhanced-card fade-in" v-else>
        <h3>Protection Advice</h3>
        <p class="sub">Loading advice...</p>
      </div>

      <div class="card enhanced-card fade-in">
        <div class="card-header">
          <span class="header-icon">🌍</span>
          <h3>City Selector</h3>
        </div>
        <p class="sub">Select a city to check local UV.</p>
        
        <div class="select-wrapper">
          <select v-model="selectedCity" @change="onCityChange" class="modern-select">
            <option v-for="loc in locations" :key="loc.key" :value="loc.key">
              {{ loc.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="card enhanced-card fade-in">
        <div class="card-header">
          <span class="header-icon">📊</span>
          <h3>Cancer Incidence (AIHW)</h3>
        </div>
        <p class="sub">Melanoma incidence trends in Australia.</p>

        <div v-if="hasStatsData" class="chart-wrapper">
          <canvas ref="statsChartCanvas"></canvas>
        </div>
        <div v-else class="empty-chart">
          <p>Loading statistics data...</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
// TODO: feature/dashboard teammate — implement this view
// Available stores (import and use directly, no need to write new API calls):
//   import { useUvStore } from '@/stores/uv'
//   const uvStore = useUvStore()
//   uvStore.fetchCurrentUv('melbourne')   — fetches + caches UV for a city
//   uvStore.fetchUvHistory()              — fetches last 7 days of UV logs
//   uvStore.currentUv                     — { uvIndex, location, advice: { level, color, emoji, clothing, spf, activity, timeWarning, alert } }
//   uvStore.uvHistory                     — array of { uv_index, location, logged_at }
//
// For stats chart call api directly:
//   import api from '@/utils/api'
//   const res = await api.get('/api/learn/stats')
//   res.data.incidenceTrend               — [{ year, cancer_type, incidence_rate }]

// Zetong He:

import { ref, onMounted, watch, nextTick } from 'vue'
import UvBadge from '@/components/common/UvBadge.vue'
import api from '@/utils/api'
import { useUvStore } from '@/stores/uv'
import Chart from 'chart.js/auto'


const uvStore = useUvStore()

// store the list of available locations for the dropdown
const locations = ref([])
// default selected city, set to Melbourne
const selectedCity = ref('melbourne')

// Card 3: City Selector Dropdown
const fetchLocations = async () => {
  try {
    const res = await api.get('/api/uv/locations')
    locations.value = res.data //  expecting an array of { key, label } objects for each location
  } catch (error) {
    console.error('Failed to fetch locations:', error)
  }
}

// city change handler for dropdown
const onCityChange = () => {
  // re-fetch UV data for the newly selected city whenever the dropdown value changes
  uvStore.fetchCurrentUv(selectedCity.value)
}

// while this page is still in progress, we can at least auto-fetch UV for the default city and the list of cities for the dropdown when the component mounts
onMounted(() => {
  uvStore.fetchCurrentUv(selectedCity.value) // auto-fetch uv data for default city
  fetchLocations() // auto-fetch list of available cities for dropdown
  fetchAndRenderStats() // fetch stats data and render chart
})

// Card 4: Cancer Incidence Stats Chart
const statsChartCanvas = ref(null)
let statsChartInstance = null
// use this flag to track whether we have valid stats data 
const hasStatsData = ref(false)

const fetchAndRenderStats = async () => {
  try {
    const res = await api.get('/api/learn/stats')
    const trendData = res.data.incidenceTrend

    if (trendData && trendData.length > 0) {
      hasStatsData.value = true
      
      await nextTick() 

      if (statsChartInstance) {
        statsChartInstance.destroy()
      }

      const labels = trendData.map(item => item.year)
      const dataPoints = trendData.map(item => item.incidence_rate)

      statsChartInstance = new Chart(statsChartCanvas.value, {
        type: 'bar', 
        data: {
          labels: labels,
          datasets: [{
            label: 'Incidence Rate (per 100k)',
            data: dataPoints,
            backgroundColor: '#e91e63', 
            borderRadius: 6, 
            barPercentage: 0.6 
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false } 
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch cancer stats:', error)
  }
}

</script>

<style scoped>
.dashboard-page {
  padding-top: calc(var(--nav-height) + var(--space-xl));
  padding-bottom: var(--space-2xl);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: var(--space-xs);
}

.sub {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.enhanced-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.enhanced-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.header-icon {
  font-size: 1.25rem;
}

.enhanced-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.badge-wrapper {
  margin-top: auto; 
  padding-top: 1rem;
}

.risk-text {
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.advice-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0;
  margin-top: auto;
}

.advice-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-text-primary);
}

.list-emoji {
  font-size: 1.1rem;
}

.warning-item {
  background: rgba(255, 152, 0, 0.1);
  padding: 0.5rem;
  border-radius: 6px;
  color: #d84315 !important;
}

.modern-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #f9f9f9;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: border-color 0.2s;
  outline: none;
  margin-top: auto;
}

.modern-select:hover, .modern-select:focus {
  border-color: #ff9800; 
  background-color: #fff;
}

.chart-wrapper {
  position: relative;
  height: 200px;
  width: 100%;
  margin-top: auto;
}

.empty-chart {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: auto;
}
</style>