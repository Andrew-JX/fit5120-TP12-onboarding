<template>
  <div class="profile-page container">

    <!-- User info card -->
    <div class="profile-header card fade-in">
      <div class="avatar">
        <span class="avatar-emoji">🌞</span>
      </div>
      <div class="profile-info">
        <h1 v-text="auth.user?.display_name || auth.user?.username" class="display-name"></h1>
        <p class="username">@<span v-text="auth.user?.username"></span></p>
        <p class="joined">Member since <span v-text="joinedDate"></span></p>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value" v-text="total"></span>
          <span class="stat-label">Diary entries</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value" v-text="uniqueParts"></span>
          <span class="stat-label">Body parts tracked</span>
        </div>
      </div>
    </div>

    <!-- Diary history section -->
    <div class="section-header fade-in">
      <h2 class="section-title">📋 My Diary History</h2>
    </div>

    <!-- Filter & sort bar -->
    <div class="filter-bar fade-in">
      <div class="filter-group">
        <label class="filter-label">Body part</label>
        <select v-model="filter.bodyPart" class="filter-select" @change="fetchEntries(1)">
          <option value="">All parts</option>
          <option v-for="part in BODY_PARTS" :key="part.value" :value="part.value">
            {{ part.emoji }} {{ part.label }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Sort</label>
        <select v-model="filter.sortBy" class="filter-select" @change="fetchEntries(1)">
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
        </select>
      </div>
      <span class="entry-count">{{ total }} {{ total === 1 ? 'entry' : 'entries' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="entries-loading">
      <LoadingSpinner message="Loading your diary…" />
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.length === 0" class="empty-state fade-in">
      <span class="empty-icon">📔</span>
      <p>No diary entries found.</p>
      <p class="empty-hint">
        <router-link to="/diary" class="link">Go to Skin Diary</router-link> to add your first entry.
      </p>
    </div>

    <!-- Entry list -->
    <div v-else class="entries-list">
      <div v-for="entry in entries" :key="entry.id" class="entry-row card fade-in">
        <!-- Thumbnail -->
        <div class="entry-thumb">
          <img v-if="entry.photo_url" :src="photoUrl(entry.photo_url)" class="thumb-img" alt="Skin photo" />
          <div v-else class="thumb-placeholder">📷</div>
        </div>

        <!-- Entry details -->
        <div class="entry-detail">
          <div class="entry-top">
            <span class="entry-part-badge">
              {{ partEmoji(entry.body_part) }} {{ partLabel(entry.body_part) }}
            </span>
            <span class="entry-date">{{ formatDate(entry.entry_date) }}</span>
          </div>
          <!-- v-text used intentionally — prevents XSS from stored notes -->
          <p v-if="entry.notes" v-text="entry.notes" class="entry-notes"></p>
          <p v-else class="entry-notes entry-notes--empty">No notes recorded.</p>
        </div>

        <!-- Actions -->
        <div class="entry-actions">
          <button class="btn-icon" title="View in diary" @click="$router.push('/diary')">
            👁
          </button>
          <button class="btn-danger-sm" @click="confirmDelete(entry)">Delete</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination fade-in">
      <button class="page-btn" :disabled="currentPage === 1" @click="fetchEntries(currentPage - 1)">← Prev</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="fetchEntries(currentPage + 1)">Next
        →</button>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3>Delete this entry?</h3>
        <p>The photo and all associated data will be permanently removed.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="deleteTarget = null">Cancel</button>
          <button class="btn-danger" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const auth = useAuthStore()

const BODY_PARTS = [
  { value: 'face', label: 'Face', emoji: '😊' },
  { value: 'arm', label: 'Arm', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🫁' },
  { value: 'leg', label: 'Leg', emoji: '🦵' },
  { value: 'shoulder', label: 'Shoulder', emoji: '🤷' },
  { value: 'neck', label: 'Neck', emoji: '🧣' },
  { value: 'other', label: 'Other', emoji: '🔵' },
]

const LIMIT = 10

// ── State ──────────────────────────────────────────────────────────────────────
const entries = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))
const uniqueParts = ref(0)

const filter = ref({ bodyPart: '', sortBy: 'date_desc' })

const deleteTarget = ref(null)
const deleting = ref(false)

// ── Computed ───────────────────────────────────────────────────────────────────
const joinedDate = computed(() => {
  const d = auth.user?.created_at
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const partEmoji = (v) => BODY_PARTS.find(p => p.value === v)?.emoji ?? '🔵'
const partLabel = (v) => BODY_PARTS.find(p => p.value === v)?.label ?? v
const photoUrl = (url) => url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ── Fetch ──────────────────────────────────────────────────────────────────────
async function fetchEntries(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const params = new URLSearchParams({ page, limit: LIMIT, sortBy: filter.value.sortBy })
    if (filter.value.bodyPart) params.append('bodyPart', filter.value.bodyPart)
    const res = await api.get(`/api/diary?${params}`)
    entries.value = res.data.entries
    total.value = res.data.total
    // Count unique body parts from full response (use unfiltered when no filter active)
    if (!filter.value.bodyPart) {
      const parts = new Set(res.data.entries.map(e => e.body_part))
      uniqueParts.value = parts.size
    }
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(entry) { deleteTarget.value = entry }

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/api/diary/${deleteTarget.value.id}`)
    deleteTarget.value = null
    fetchEntries(currentPage.value)
  } catch {
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

onMounted(() => fetchEntries(1))
</script>

<style scoped>
.profile-page {
  padding-top: calc(var(--nav-height) + var(--space-xl));
  padding-bottom: var(--space-2xl);
  min-height: 100vh;
}

/* Profile header */
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.profile-info {
  flex: 1;
  min-width: 160px;
}

.display-name {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 0.2rem;
}

.username {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.joined {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stats-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-left: auto;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
  white-space: nowrap;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

/* Section header */
.section-header {
  margin-bottom: var(--space-sm);
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-select {
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
}

.entry-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Entry list */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.entry-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  flex-wrap: wrap;
}

.entry-thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface-2);
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.entry-detail {
  flex: 1;
  min-width: 180px;
}

.entry-top {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.entry-part-badge {
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--color-surface-2);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}

.entry-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.entry-notes {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.entry-notes--empty {
  font-style: italic;
  color: var(--color-text-muted);
}

.entry-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.3rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-surface-2);
}

/* Loading / empty */
.entries-loading {
  padding: var(--space-2xl) 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-2xl) 0;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--space-md);
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: var(--space-sm);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-2xl);
}

.page-btn {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-surface-2);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Delete button */
.btn-danger-sm {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-sm);
  background: #fff5f5;
  color: #dc2626;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-danger-sm:hover {
  background: #fee2e2;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.modal h3 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
  color: var(--color-text-primary);
}

.modal p {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn-danger {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  background: #dc2626;
  color: white;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.6rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--color-surface-2);
}
</style>