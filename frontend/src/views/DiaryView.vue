<template>
  <div class="diary-page container">

    <!-- Page header -->
    <div class="page-header fade-in">
      <div class="header-text">
        <h1>Skin Diary</h1>
        <p class="sub">Track your skin changes over time to spot UV damage early.</p>
      </div>
      <button class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? '✕ Cancel' : '+ New Entry' }}
      </button>
    </div>

    <!-- Upload form -->
    <transition name="slide-down">
      <div v-if="showForm" class="card upload-card fade-in">
        <h2 class="section-title">Add New Entry</h2>
        <div class="form-grid">
          <div class="form-group photo-group">
            <label class="form-label">Photo <span class="required">*</span></label>
            <div class="dropzone" :class="{ 'dropzone--active': isDragging, 'dropzone--filled': photoPreview }"
              @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()">
              <img v-if="photoPreview" :src="photoPreview" class="photo-preview" alt="Preview" />
              <div v-else class="dropzone-placeholder">
                <span class="dropzone-icon">📁</span>
                <p>Click or drag to upload</p>
                <p class="hint">JPG, PNG, WebP · max 5 MB</p>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none"
              @change="handleFileSelect" />
            <p v-if="errors.photo" class="error-msg">{{ errors.photo }}</p>
          </div>
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label" for="bodyPart">Body Part <span class="required">*</span></label>
              <select id="bodyPart" v-model="form.bodyPart" class="form-input" :class="{ error: errors.bodyPart }">
                <option value="">Select body part…</option>
                <option v-for="part in BODY_PARTS" :key="part.value" :value="part.value">
                  {{ part.emoji }} {{ part.label }}
                </option>
              </select>
              <p v-if="errors.bodyPart" class="error-msg">{{ errors.bodyPart }}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="entryDate">Date <span class="required">*</span></label>
              <input id="entryDate" v-model="form.entryDate" type="date" class="form-input" :max="todayStr"
                :class="{ error: errors.entryDate }" />
              <p v-if="errors.entryDate" class="error-msg">{{ errors.entryDate }}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="notes">Notes</label>
              <textarea id="notes" v-model="form.notes" class="form-input notes-input"
                placeholder="Describe any changes, redness, new spots…" maxlength="1000" rows="4"></textarea>
              <p class="char-count">{{ form.notes.length }} / 1000</p>
              <p v-if="errors.notes" class="error-msg">{{ errors.notes }}</p>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <p v-if="submitError" class="error-msg server-error">{{ submitError }}</p>
          <button class="btn btn-primary submit-btn" :disabled="submitting" @click="handleSubmit">
            <span v-if="submitting">Saving…</span>
            <span v-else>Save Entry</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- ── AC3: Timeline Comparison ──────────────────────────────────────── -->
    <div class="card timeline-card fade-in">
      <div class="timeline-header">
        <div>
          <h2 class="section-title">📅 Timeline Comparison</h2>
          <p class="timeline-desc">Select a date range and body part to compare your earliest and latest photos.</p>
        </div>
      </div>

      <div class="timeline-controls">
        <div class="filter-group">
          <label class="filter-label">Body part</label>
          <select v-model="timeline.bodyPart" class="filter-select" @change="runTimeline">
            <option value="">All parts</option>
            <option v-for="part in BODY_PARTS" :key="part.value" :value="part.value">
              {{ part.emoji }} {{ part.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">From</label>
          <input type="date" v-model="timeline.from" class="filter-select" @change="runTimeline" />
        </div>
        <div class="filter-group">
          <label class="filter-label">To</label>
          <input type="date" v-model="timeline.to" :max="todayStr" class="filter-select" @change="runTimeline" />
        </div>
      </div>

      <!-- Result: first vs last -->
      <div v-if="timelineLoading" class="timeline-empty">
        <LoadingSpinner message="Loading comparison…" />
      </div>
      <div v-else-if="timelineError" class="timeline-empty">
        <span class="empty-icon">⚠️</span>
        <p>{{ timelineError }}</p>
      </div>
      <div v-else-if="timelineFirst && timelineLast" class="timeline-compare">
        <div class="compare-card">
          <div class="compare-label compare-label--first">Earliest</div>
          <div class="compare-photo-wrap">
            <img v-if="timelineFirst.photo_url" :src="photoUrl(timelineFirst.photo_url)" class="compare-photo"
              alt="Earliest" />
            <div v-else class="compare-photo-placeholder">📷</div>
          </div>
          <div class="compare-info">
            <span class="compare-part">{{ partEmoji(timelineFirst.body_part) }} {{ partLabel(timelineFirst.body_part)
            }}</span>
            <span class="compare-date">{{ formatDate(timelineFirst.entry_date) }}</span>
            <p v-if="timelineFirst.notes" v-text="timelineFirst.notes" class="compare-notes"></p>
          </div>
        </div>

        <div class="compare-arrow">
          <span>VS</span>
          <div class="compare-diff" v-if="timelineDaysDiff !== null">
            {{ timelineDaysDiff }} days apart
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-label compare-label--last">Latest</div>
          <div class="compare-photo-wrap">
            <img v-if="timelineLast.photo_url" :src="photoUrl(timelineLast.photo_url)" class="compare-photo"
              alt="Latest" />
            <div v-else class="compare-photo-placeholder">📷</div>
          </div>
          <div class="compare-info">
            <span class="compare-part">{{ partEmoji(timelineLast.body_part) }} {{ partLabel(timelineLast.body_part)
            }}</span>
            <span class="compare-date">{{ formatDate(timelineLast.entry_date) }}</span>
            <p v-if="timelineLast.notes" v-text="timelineLast.notes" class="compare-notes"></p>
          </div>
        </div>
      </div>
      <div v-else-if="timelineSearched" class="timeline-empty">
        <span class="empty-icon">🔍</span>
        <p>No entries found for this period. Try a different date range or body part.</p>
      </div>
      <div v-else class="timeline-empty">
        <span class="empty-icon">📅</span>
        <p>Select a date range above to compare your skin photos over time.</p>
      </div>
    </div>
    <!-- ── end AC3 ─────────────────────────────────────────────────────────── -->

    <!-- Filter bar -->
    <div class="filter-bar fade-in">
      <div class="filter-group">
        <label class="filter-label">Filter by part</label>
        <select v-model="filter.bodyPart" class="filter-select" @change="fetchEntries(1)">
          <option value="">All</option>
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
      <LoadingSpinner message="Loading entries…" />
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.length === 0" class="empty-state fade-in">
      <span class="empty-icon">🌞</span>
      <p>No diary entries yet.</p>
      <p class="empty-hint">Add your first entry to start tracking your skin health.</p>
    </div>

    <!-- Entry grid -->
    <div v-else class="entries-grid">
      <div v-for="entry in entries" :key="entry.id" class="entry-card card fade-in">
        <div class="entry-photo-wrap">
          <img v-if="entry.photo_url" :src="photoUrl(entry.photo_url)" class="entry-photo" alt="Skin photo" />
          <div v-else class="entry-photo-placeholder">📷</div>
        </div>
        <div class="entry-body">
          <div class="entry-meta">
            <span class="entry-part">{{ partEmoji(entry.body_part) }} {{ partLabel(entry.body_part) }}</span>
            <span class="entry-date">{{ formatDate(entry.entry_date) }}</span>
          </div>
          <p v-if="entry.notes" v-text="entry.notes" class="entry-notes"></p>
          <p v-else class="entry-notes entry-notes--empty">No notes.</p>
          <button class="btn btn-danger-sm" @click="confirmDelete(entry)">Delete</button>
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

    <!-- Delete modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3>Delete this entry?</h3>
        <p>This will permanently remove the photo and record. This cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const BODY_PARTS = [
  { value: 'face', label: 'Face', emoji: '😊' },
  { value: 'arm', label: 'Arm', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🫁' },
  { value: 'leg', label: 'Leg', emoji: '🦵' },
  { value: 'shoulder', label: 'Shoulder', emoji: '🤷' },
  { value: 'neck', label: 'Neck', emoji: '🧣' },
  { value: 'other', label: 'Other', emoji: '🔵' },
]
const LIMIT = 9

// existing state
const showForm = ref(false)
const isDragging = ref(false)
const photoFile = ref(null)
const photoPreview = ref('')
const submitting = ref(false)
const submitError = ref('')
const errors = ref({})
const form = ref({ bodyPart: '', entryDate: new Date().toISOString().slice(0, 10), notes: '' })
const entries = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(total.value / LIMIT))
const filter = ref({ bodyPart: '', sortBy: 'date_desc' })
const deleteTarget = ref(null)
const deleting = ref(false)
const todayStr = new Date().toISOString().slice(0, 10)

// ── AC3 timeline state ────────────────────────────────────────────────────────
const timeline = ref({
  bodyPart: '',
  from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // default: 90 days ago
  to: todayStr,
})
const timelineFirst = ref(null)
const timelineLast = ref(null)
const timelineLoading = ref(false)
const timelineError = ref('')
const timelineSearched = ref(false)
const timelineDaysDiff = computed(() => {
  if (!timelineFirst.value || !timelineLast.value) return null
  const a = new Date(timelineFirst.value.entry_date)
  const b = new Date(timelineLast.value.entry_date)
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24))
})

async function runTimeline() {
  timelineError.value = ''
  timelineFirst.value = null
  timelineLast.value = null
  timelineSearched.value = true
  if (!timeline.value.from || !timeline.value.to) return
  if (timeline.value.from > timeline.value.to) {
    timelineError.value = 'Start date must be before end date.'
    return
  }
  timelineLoading.value = true
  try {
    // Fetch oldest in range (date_asc, limit 1)
    const firstParams = new URLSearchParams({
      page: 1, limit: 1, sortBy: 'date_asc',
      dateFrom: timeline.value.from, dateTo: timeline.value.to,
    })
    if (timeline.value.bodyPart) firstParams.append('bodyPart', timeline.value.bodyPart)

    // Fetch newest in range (date_desc, limit 1)
    const lastParams = new URLSearchParams({
      page: 1, limit: 1, sortBy: 'date_desc',
      dateFrom: timeline.value.from, dateTo: timeline.value.to,
    })
    if (timeline.value.bodyPart) lastParams.append('bodyPart', timeline.value.bodyPart)

    const [firstRes, lastRes] = await Promise.all([
      api.get(`/api/diary?${firstParams}`),
      api.get(`/api/diary?${lastParams}`),
    ])

    const firstEntries = firstRes.data.entries
    const lastEntries = lastRes.data.entries

    if (firstEntries.length === 0) return // no entries — timelineSearched triggers empty msg

    timelineFirst.value = firstEntries[0]
    timelineLast.value = lastEntries[0]

    // If only one entry exists, first and last are the same — still show it
  } catch {
    timelineError.value = 'Failed to load timeline. Please try again.'
  } finally {
    timelineLoading.value = false
  }
}

// helpers
const partEmoji = (v) => BODY_PARTS.find(p => p.value === v)?.emoji ?? '🔵'
const partLabel = (v) => BODY_PARTS.find(p => p.value === v)?.label ?? v
const photoUrl = (url) => url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// photo handling
function processFile(file) {
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) { errors.value.photo = 'Only JPG, PNG, or WebP images are allowed.'; return }
  if (file.size > 5 * 1024 * 1024) { errors.value.photo = 'File must be under 5 MB.'; return }
  errors.value.photo = ''
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}
function handleFileSelect(e) { processFile(e.target.files[0]) }
function handleDrop(e) { isDragging.value = false; processFile(e.dataTransfer.files[0]) }

// validation
function validate() {
  const e = {}
  if (!photoFile.value) e.photo = 'Please select a photo.'
  if (!form.value.bodyPart) e.bodyPart = 'Please select a body part.'
  if (!form.value.entryDate) e.entryDate = 'Please select a date.'
  if (form.value.notes.length > 1000) e.notes = 'Notes must be 1000 characters or less.'
  if (/<script|javascript:/i.test(form.value.notes)) e.notes = 'Invalid characters in notes.'
  errors.value = e
  return Object.keys(e).length === 0
}

// submit
async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('photo', photoFile.value)
    fd.append('bodyPart', form.value.bodyPart)
    fd.append('entryDate', form.value.entryDate)
    fd.append('notes', form.value.notes)
    await api.post('/api/diary', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    showForm.value = false
    photoFile.value = null
    photoPreview.value = ''
    form.value = { bodyPart: '', entryDate: new Date().toISOString().slice(0, 10), notes: '' }
    errors.value = {}
    fetchEntries(1)
  } catch (err) {
    submitError.value = err.response?.data?.error || 'Failed to save entry. Please try again.'
  } finally {
    submitting.value = false
  }
}

// fetch
async function fetchEntries(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const params = new URLSearchParams({ page, limit: LIMIT, sortBy: filter.value.sortBy })
    if (filter.value.bodyPart) params.append('bodyPart', filter.value.bodyPart)
    const res = await api.get(`/api/diary?${params}`)
    entries.value = res.data.entries
    total.value = res.data.total
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

// delete
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
.diary-page {
  padding-top: calc(var(--nav-height) + var(--space-xl));
  padding-bottom: var(--space-2xl);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-xs);
}

.sub {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.upload-card {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: var(--space-lg);
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-xl);
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  overflow: hidden;
}

.dropzone:hover,
.dropzone--active {
  border-color: var(--color-primary);
  background: #fef3ee;
}

.dropzone--filled {
  border-style: solid;
}

.dropzone-placeholder {
  text-align: center;
  padding: var(--space-md);
}

.dropzone-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-sm);
}

.dropzone-placeholder p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.dropzone-placeholder .hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.notes-input {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: right;
  margin-top: 0.25rem;
}

.required {
  color: var(--color-primary);
}

.form-actions {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.server-error {
  flex: 1;
}

.submit-btn {
  min-width: 140px;
  justify-content: center;
}

/* ── AC3 Timeline ─────────────────────────────────────────────────────────── */
.timeline-card {
  margin-bottom: var(--space-xl);
}

.timeline-header {
  margin-bottom: var(--space-md);
}

.timeline-desc {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.timeline-empty {
  text-align: center;
  padding: var(--space-xl) 0;
  color: var(--color-text-secondary);
}

.timeline-empty .empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-sm);
}

.timeline-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-lg);
  align-items: start;
}

@media (max-width: 680px) {
  .timeline-compare {
    grid-template-columns: 1fr;
  }

  .compare-arrow {
    flex-direction: row;
    justify-content: center;
  }
}

.compare-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
}

.compare-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.4rem 0.75rem;
  text-align: center;
}

.compare-label--first {
  background: #e8f5e9;
  color: #2e7d32;
}

.compare-label--last {
  background: #fff3e0;
  color: #e65100;
}

.compare-photo-wrap {
  width: 100%;
  aspect-ratio: 1;
  background: var(--color-surface-2);
  overflow: hidden;
}

.compare-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.compare-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  min-height: 180px;
}

.compare-info {
  padding: var(--space-md);
}

.compare-part {
  font-size: 0.875rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.compare-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: block;
  margin-bottom: var(--space-sm);
}

.compare-notes {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compare-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) 0;
  min-width: 60px;
}

.compare-arrow span {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text-muted);
}

.compare-diff {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
}

/* ── end AC3 ──────────────────────────────────────────────────────────────── */

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

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.entry-card {
  padding: 0;
  overflow: hidden;
}

.entry-photo-wrap {
  width: 100%;
  height: 200px;
  background: var(--color-surface-2);
  overflow: hidden;
}

.entry-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.entry-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--color-text-muted);
}

.entry-body {
  padding: var(--space-md);
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.entry-part {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.entry-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.entry-notes {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-notes--empty {
  font-style: italic;
  color: var(--color-text-muted);
}

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

.slide-down-enter-active {
  transition: all 0.3s ease;
}

.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>