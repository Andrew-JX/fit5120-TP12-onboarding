<template>
  <!-- Learn page — Owner: Teammate | Branch: feature/learn -->
  <div class="learn-page container">
    <div class="page-header fade-in">
      <h1>Learn</h1>
      <p class="sub">Understand UV risks, skin types, and how to stay sun-safe.</p>
    </div>

    <!-- Daily UV Question -->
    <div class="quiz-card fade-in">
      <div class="quiz-left">
        <img src="@/assets/Part1.jpeg" alt="Beach" />
      </div>
      <div class="quiz-right">
        <div class="quiz-badge">☀️ Today's UV Question</div>
        <p class="quiz-question">{{ question.text }}</p>
        <div class="quiz-options">
          <label v-for="option in question.options" :key="option">
            <input type="radio" :value="option" v-model="selected" :disabled="submitted" />
            {{ option }}
          </label>
        </div>
        <div class="quiz-bottom">
          <button class="quiz-submit" @click="submit" :disabled="!selected || submitted">Submit</button>
          <span v-if="submitted" :class="isCorrect ? 'correct' : 'wrong'">
            {{ isCorrect ? 'Correct' : `Wrong (correct answer: ${question.answer})` }}
          </span>
        </div>
        <p v-if="submitted && !isCorrect" class="explanation">
          <span class="explanation-label">Explain</span>
          You can get sun damage on windy, cloudy and cool days. Sun damage is caused by ultraviolet (UV) radiation, not temperature.
        </p>
      </div>
    </div>

    <!-- Sunscreen Myths & Misconceptions -->
    <div class="myths-card fade-in">
      <div class="myths-left">
        <div class="myths-title-box">
          <h3>Sunscreen Myths & Misconceptions</h3>
        </div>
        <ul class="myths-list">
          <li v-for="(myth, index) in myths" :key="index" @click="openMyth(index)">
            {{ index + 1 }}. {{ myth.title }}
          </li>
        </ul>
      </div>
      <div class="myths-right">
        <img src="@/assets/Part2.jpg" alt="Sunscreen" />
      </div>
    </div>

    <!-- Modal -->
    <div v-if="activeMyth !== null" class="modal-overlay" @click.self="closeMyth">
      <div class="modal">
        <button class="modal-close" @click="closeMyth">✕</button>
        <h4>{{ activeMyth + 1 }}. {{ myths[activeMyth].title }}</h4>
        <p>{{ myths[activeMyth].detail }}</p>
      </div>
    </div>

    <!-- Skin Type Quiz -->
    <div class="skin-quiz-card fade-in">
      <div class="skin-quiz-title-box">
        <h3>What's Your Skin Type?</h3>
      </div>
      <p class="skin-quiz-intro">
        Answer the questions below to find out your skin type. Each option carries a score (shown by the number before it) — your total score determines your skin type.
      </p>

      <div class="step-indicator" v-if="!skinResult">
        <span v-for="(section, i) in skinSections" :key="i"
          :class="['step-dot', { active: skinStep === i, done: skinStep > i }]">
          {{ i + 1 }}
        </span>
        <span class="step-label">{{ skinSections[skinStep].title }}</span>
      </div>

      <div v-if="!skinResult">
        <div v-for="(q, qi) in skinSections[skinStep].questions" :key="qi" class="skin-question-block">
          <p class="skin-question-text">{{ q.text }}</p>
          <div class="skin-options">
            <label v-for="(opt, oi) in q.options" :key="oi" :class="['skin-option', { selected: skinAnswers[skinStep][qi] === oi }]">
              <input type="radio" :name="`s${skinStep}-q${qi}`" :value="oi" v-model="skinAnswers[skinStep][qi]" hidden />
              <span class="skin-option-score">{{ oi }}</span>
              <span class="skin-option-text">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="skin-nav">
          <button class="skin-btn secondary" v-if="skinStep > 0" @click="skinStep--">← Back</button>
          <button class="skin-btn reset" @click="resetCurrentStep">Clear</button>
          <button class="skin-btn primary" v-if="skinStep < skinSections.length - 1"
            @click="nextStep" :disabled="!stepComplete">Next →</button>
          <button class="skin-btn primary" v-if="skinStep === skinSections.length - 1"
            @click="calcSkinResult" :disabled="!stepComplete">See My Result</button>
        </div>
      </div>

      <div v-if="skinResult" class="skin-result">
        <div class="skin-result-block" :style="{ background: skinResult.color }">
          <div class="skin-result-left">
            <div class="skin-result-score">{{ skinTotalScore }}</div>
            <div class="skin-result-type">{{ skinResult.type }}</div>
          </div>
          <div class="skin-result-right">
            <div class="skin-result-name">{{ skinResult.name }}</div>
            <div class="skin-result-desc">{{ skinResult.description }}</div>
            <div class="skin-result-example"><em>{{ skinResult.example }}</em></div>
          </div>
        </div>
        <button class="skin-btn secondary" style="margin-top:1rem" @click="resetSkinQuiz">Retake Quiz</button>
      </div>
    </div>

    <!-- Sun Protection Advice -->
    <div class="advice-card fade-in">
      <div class="advice-title-box">
        <h3>☀️ Sun Protection Advice</h3>
      </div>
      <p class="advice-intro">Select your skin type to get personalised sun protection recommendations.</p>

      <div class="advice-type-selector">
        <button
          v-for="(type, i) in skinTypes"
          :key="i"
          :class="['advice-type-btn', { active: selectedAdviceType === i }]"
          :style="selectedAdviceType === i ? { background: type.color, color: 'white', borderColor: type.color } : {}"
          @click="selectedAdviceType = i"
        >
          {{ type.type }}
        </button>
      </div>

      <div v-if="selectedAdviceType !== null" class="advice-content">
        <div class="advice-skin-label" :style="{ background: skinTypes[selectedAdviceType].color }">
          {{ skinTypes[selectedAdviceType].type }} — {{ skinTypes[selectedAdviceType].name }}
        </div>
        <div class="advice-risk-badge" :class="adviceData[selectedAdviceType].riskClass">
          {{ adviceData[selectedAdviceType].riskLabel }}
        </div>
        <div class="advice-cards-grid">
          <div class="advice-item-card" v-for="(item, i) in adviceData[selectedAdviceType].tips" :key="i">
            <div class="advice-item-icon">{{ item.icon }}</div>
            <div>
              <div class="advice-item-title">{{ item.title }}</div>
              <div class="advice-item-text">{{ item.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Articles & Resources -->
    <div class="resources-card fade-in">
      <div class="resources-title-box">
        <h3>📚 Articles & Resources</h3>
      </div>

      <div class="resources-section-label">🌐 Websites</div>
      <div class="resources-grid">
        <a v-for="link in webLinks" :key="link.url" :href="link.url" target="_blank" class="resource-item">
          <div class="resource-item-icon">🔗</div>
          <div>
            <div class="resource-item-title">{{ link.title }}</div>
            <div class="resource-item-source">{{ link.source }}</div>
          </div>
        </a>
      </div>

      <div class="resources-section-label" style="margin-top: 1.5rem;">📄 PDF Documents</div>
      <div class="resources-grid">
        <a v-for="pdf in pdfLinks" :key="pdf.url" :href="pdf.url" target="_blank" class="resource-item">
          <div class="resource-item-icon">📑</div>
          <div>
            <div class="resource-item-title">{{ pdf.title }}</div>
            <div class="resource-item-source">{{ pdf.source }}</div>
          </div>
        </a>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Daily Quiz
const question = {
  text: "On cloudy days, you don't need sunscreen.",
  options: ['True', 'False'],
  answer: 'False'
}
const selected = ref(null)
const submitted = ref(false)
const isCorrect = computed(() => selected.value === question.answer)
function submit() {
  if (selected.value) submitted.value = true
}

// Myths
const activeMyth = ref(null)
function openMyth(index) { activeMyth.value = index }
function closeMyth() { activeMyth.value = null }

const myths = [
  { title: "You can't get sunburnt in the shade", detail: "Actually, it's UV radiation – not sunlight – that damages your skin. Even though we can't see or feel them, UV rays reflect off surfaces like sand, water and even grass. So while a leafy tree or shade sail will block some UV rays, others will bounce from those sunny areas to reach your skin. That's why you should always use all five sun protection measures – clothing, sunscreen, a hat, sunglasses and shade – for the best protection." },
  { title: "A tan that builds up over summer isn't dangerous", detail: "Any tan is a sign of UV damage, even if you didn't deliberately try to get a tan. We call this 'incidental' damage, because it's usually the UV damage we get when we're out and about running errands, taking a lunchtime stroll or doing something as simple as hanging the washing in the backyard. All UV damage – the deliberate sun tans, incidental tans and accidental sunburns – adds up over time to increase our risk of skin cancer." },
  { title: "You can't get sunburnt on cloudy or cool days", detail: "UV radiation can be just as fierce on a day when it's hot and sunny, as when it's cool or cloudy. Remember – you can't see or feel UV rays, so don't let your senses fool you. Instead, check the sun protection times each day so you know when UV levels will be high enough to damage your skin." },
  { title: "I used to sunbake when I was younger, so it's too late for me", detail: "It's never too late for skin cancer prevention. In fact, skin cancer is one of the most preventable cancers because sun protection is effective at any age." },
  { title: "I don't need sunscreen because there's SPF in my cosmetics", detail: "Cosmetics and moisturisers with SPF are great to add to your sun protection arsenal, but as with a regular sunscreen, you still need to top up your application every two hours. Also be aware that most cosmetics offer protection that is much lower than the recommended minimum of SPF30, and may not be broad-spectrum to filter both UVA and UVB radiation." },
  { title: "I won't get skin cancer because I tan and don't burn", detail: "All skin types can be damaged by UV radiation and all skin types can get skin cancer. That's why we all need to use sun protection. Remember, if your skin browns in the sun, it's a sign UV rays have damaged your skin cells. A tan is a sign of skin cells in trauma – not health." },
  { title: "I need to go out in the sun without protection for vitamin D", detail: "Skin can be sunburnt in as little as 11 minutes in Victoria on a clear summer's day. A few minutes of UV exposure to your hands and arms in the early morning or late afternoon can be all you need in summer to meet your vitamin D requirements. If you are in an at-risk group for vitamin D deficiency, speak to your doctor about supplementation. Overexposure to UV is never recommended for anyone." }
]

// Skin Type Quiz
const skinSections = [
  {
    title: 'Genetic (physical traits)',
    questions: [
      { text: 'What are the colour of your eyes?', options: ['Light blue or green, grey', 'Blue, green, grey', 'Dark blue or green, light brown (hazel)', 'Dark brown', 'Brownish black'] },
      { text: 'What is the colour of your hair (naturally and before aging)?', options: ['Red', 'Blonde', 'Chestnut or dark blonde', 'Dark brown', 'Black'] },
      { text: 'What is the colour of your skin (unexposed areas)?', options: ['Pink', 'Very pale', 'Light brown or olive', 'Brown', 'Dark brown'] },
      { text: 'Do you have freckles on unexposed areas?', options: ['Many', 'Several', 'Few', 'Rare', 'None'] }
    ]
  },
  {
    title: 'Sensitivity (reaction to sun exposure)',
    questions: [
      { text: 'What happens to your skin if you stay in the sun for an extended period?', options: ['Severe burns, blistering, peeling', 'Moderate burns, blistering, peeling', 'Burns sometimes followed by peeling', 'Rare burns', 'No burns'] },
      { text: 'Do you turn brown after sun exposure?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      { text: 'How brown do you get?', options: ['Hardly or not at all', 'Light tan', 'Medium tan', 'Dark tan', 'Very dark tan'] },
      { text: 'Is your face sensitive to the sun?', options: ['Very sensitive', 'Sensitive', 'Mildly sensitive', 'Resistant', 'Very resistant'] }
    ]
  },
  {
    title: 'Intentional exposure (tanning habits)',
    questions: [
      { text: 'How often do you tan?', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] },
      { text: 'When did you last expose your skin to the sun or artificial tanning sources (tanning beds)?', options: ['More than three months ago', 'In the last 2–3 months', 'In the last 1–2 months', 'In the last week', 'In the last day'] }
    ]
  }
]

const skinStep = ref(0)
const skinAnswers = ref([
  Array(skinSections[0].questions.length).fill(null),
  Array(skinSections[1].questions.length).fill(null),
  Array(skinSections[2].questions.length).fill(null),
])
const skinResult = ref(null)
const skinTotalScore = ref(0)

const stepComplete = computed(() =>
  skinAnswers.value[skinStep.value].every(a => a !== null)
)

function nextStep() {
  if (stepComplete.value) skinStep.value++
}

function resetCurrentStep() {
  skinAnswers.value[skinStep.value] = Array(skinSections[skinStep.value].questions.length).fill(null)
}

function calcSkinResult() {
  if (!stepComplete.value) return
  const total = skinAnswers.value.flat().reduce((sum, v) => sum + (v ?? 0), 0)
  skinTotalScore.value = total
  if (total <= 6) skinResult.value = skinTypes[0]
  else if (total <= 13) skinResult.value = skinTypes[1]
  else if (total <= 20) skinResult.value = skinTypes[2]
  else if (total <= 27) skinResult.value = skinTypes[3]
  else if (total <= 34) skinResult.value = skinTypes[4]
  else skinResult.value = skinTypes[5]
}

function resetSkinQuiz() {
  skinStep.value = 0
  skinAnswers.value = [
    Array(skinSections[0].questions.length).fill(null),
    Array(skinSections[1].questions.length).fill(null),
    Array(skinSections[2].questions.length).fill(null),
  ]
  skinResult.value = null
  skinTotalScore.value = 0
}

const skinTypes = [
  { type: 'Type I',   name: 'Pale white skin',                          color: '#e8d96a', description: 'Extremely sensitive skin, always burns, never tans',                       example: 'Example: red hair with freckles' },
  { type: 'Type II',  name: 'White skin',                               color: '#c9a84c', description: 'Very sensitive skin, burns easily, tans minimally',                        example: 'Example: fair skinned, fair haired Caucasians, northern Asians' },
  { type: 'Type III', name: 'Light brown skin',                         color: '#a0522d', description: 'Sensitive skin, sometimes burns, slowly tans to light brown',              example: 'Example: darker Caucasians, some Asians' },
  { type: 'Type IV',  name: 'Moderate brown skin',                      color: '#8b3a1a', description: 'Mildly sensitive, burns minimally, always tans to moderate brown',         example: 'Example: Mediterranean and Middle Eastern Caucasians, southern Asians' },
  { type: 'Type V',   name: 'Dark brown skin',                          color: '#6b2a10', description: 'Resistant skin, rarely burns, tans well',                                  example: 'Example: some Hispanics, some Africans' },
  { type: 'Type VI',  name: 'Deeply pigmented dark brown to black skin', color: '#3b1508', description: 'Very resistant skin, never burns, deeply pigmented',                       example: 'Example: darker Africans, Indigenous Australians' },
]

// Sun Protection Advice
const selectedAdviceType = ref(null)

const adviceData = [
  {
    riskLabel: '🔴 Highest Risk — Extreme Caution Required',
    riskClass: 'risk-high',
    tips: [
      { icon: '🧴', title: 'Daily Sunscreen', text: 'Apply SPF 30+ broad-spectrum sunscreen every morning as part of your daily routine, on all days when UV index is forecast to reach ≥3.' },
      { icon: '👕', title: 'Cover Up', text: 'Wear covering clothing with a tight weave. Dark colours offer the best protection. Cover as much skin as possible.' },
      { icon: '🧢', title: 'Wear a Hat', text: 'Always wear a broad-brimmed hat when outdoors during sun protection times.' },
      { icon: '🕶️', title: 'Sunglasses', text: 'Wear wrap-around sunglasses (category 2 or 3) to protect your eyes and surrounding skin.' },
      { icon: '🌳', title: 'Seek Shade', text: 'Where possible, plan outdoor activities for when the UV index is below 3. Seek shade whenever available.' },
      { icon: '🌅', title: 'Morning Light Only', text: 'Time outdoors in the early morning (before 7am, UV index <1) is safe and beneficial for mood and circadian rhythm.' },
      { icon: '💊', title: 'Vitamin D', text: 'Strict sun protection may lead to vitamin D deficiency. Discuss dietary sources and supplements with your doctor.' },
    ]
  },
  {
    riskLabel: '🔴 Highest Risk — Extreme Caution Required',
    riskClass: 'risk-high',
    tips: [
      { icon: '🧴', title: 'Daily Sunscreen', text: 'Apply SPF 30+ broad-spectrum sunscreen every morning as part of your daily routine, on all days when UV index is forecast to reach ≥3.' },
      { icon: '👕', title: 'Cover Up', text: 'Wear covering clothing whenever outdoors during sun protection times. Dark, tight-weave fabrics offer the best protection.' },
      { icon: '🧢', title: 'Wear a Hat', text: 'Always wear a broad-brimmed hat when outdoors during sun protection times.' },
      { icon: '🕶️', title: 'Sunglasses', text: 'Wear wrap-around sunglasses (category 2 or 3) to protect your eyes and surrounding skin.' },
      { icon: '🌳', title: 'Seek Shade', text: 'Avoid outdoors when UV index is ≥3 where possible. Always seek shade when available.' },
      { icon: '🌅', title: 'Morning Light Only', text: 'Early morning exposure (before 7am) is safe and beneficial for mood and circadian rhythm without UV risk.' },
      { icon: '💊', title: 'Vitamin D', text: 'Due to strict sun avoidance, meet vitamin D requirements through dietary sources (oily fish, eggs, fortified foods) and/or supplements.' },
    ]
  },
  {
    riskLabel: '🟡 Intermediate Risk — Sun Protection Recommended',
    riskClass: 'risk-medium',
    tips: [
      { icon: '🧴', title: 'Daily Sunscreen', text: 'Apply SPF 30+ sunscreen on all days when the UV index is forecast to reach ≥3, even if only briefly outdoors.' },
      { icon: '⏱️', title: 'Limit Exposure Time', text: 'A small amount of sun exposure maintains vitamin D. Once you have had enough, protect your skin in 5 ways: clothing, sunscreen, hat, shade, sunglasses.' },
      { icon: '🧢', title: 'Wear a Hat', text: 'Wear a broad-brimmed hat when spending extended time outdoors during sun protection times.' },
      { icon: '🕶️', title: 'Sunglasses', text: 'Wear wrap-around sunglasses (category 2 or 3) routinely outdoors.' },
      { icon: '🌳', title: 'Seek Shade', text: 'If outdoors for longer than needed for vitamin D, seek shade and use other protective measures.' },
      { icon: '☀️', title: 'Vitamin D Balance', text: 'In summer, less than 10 minutes outdoors with arms and legs exposed is often enough for vitamin D. You do not need extended sun exposure.' },
      { icon: '🌅', title: 'Morning Benefits', text: 'Early morning light (before 7am) is great for mood and circadian rhythm without UV risk.' },
    ]
  },
  {
    riskLabel: '🟡 Intermediate Risk — Sun Protection Recommended',
    riskClass: 'risk-medium',
    tips: [
      { icon: '🧴', title: 'Daily Sunscreen', text: 'Apply SPF 30+ sunscreen on all days when the UV index is forecast to reach ≥3 as part of your morning routine.' },
      { icon: '⏱️', title: 'Balance Exposure', text: 'Spend some time outdoors with skin exposed to maintain vitamin D, then apply full sun protection if staying longer.' },
      { icon: '🧢', title: 'Wear a Hat', text: 'Wear a broad-brimmed hat when spending extended time outdoors.' },
      { icon: '🕶️', title: 'Sunglasses', text: 'Wear wrap-around sunglasses routinely to protect your eyes.' },
      { icon: '🌳', title: 'Seek Shade', text: 'Seek shade when outdoors for extended periods, especially at peak UV times.' },
      { icon: '☀️', title: 'Vitamin D', text: 'Regular moderate sun exposure helps maintain vitamin D. In southern Australia in winter, consider supplements if outdoor time is limited.' },
      { icon: '🌅', title: 'Morning Light', text: 'Morning exposure before 7am is beneficial for mood and sleep without UV risk.' },
    ]
  },
  {
    riskLabel: '🟢 Lowest Risk — Routine Protection May Not Be Needed',
    riskClass: 'risk-low',
    tips: [
      { icon: '🧴', title: 'Sunscreen Optional', text: 'Routine daily sunscreen is not required, but consider applying if spending extended time outdoors (2+ hours) when UV index is ≥3.' },
      { icon: '👕', title: 'Extended Outdoor Cover', text: 'Consider covering clothing for very long periods outdoors in high UV conditions to prevent photoaging.' },
      { icon: '🕶️', title: 'Sunglasses Always', text: 'Wear sunglasses routinely outdoors to protect your eyes — all skin types are at risk of eye damage.' },
      { icon: '☀️', title: 'Vitamin D Priority', text: 'You are at higher risk of vitamin D deficiency. Spend time outdoors regularly with skin exposed. Aim for 2–4 times the duration recommended for lighter skin types.' },
      { icon: '🥗', title: 'Dietary Sources', text: 'Include vitamin D-rich foods in your diet: oily fish, eggs, lean red meat, and fortified dairy products.' },
      { icon: '💊', title: 'Consider Supplements', text: 'If you live in southern Australia or have limited outdoor time, speak to your doctor about vitamin D supplementation.' },
      { icon: '🌅', title: 'Morning Light', text: 'Early morning outdoor time benefits mood and circadian rhythm. Sun protection is not needed at this time.' },
    ]
  },
  {
    riskLabel: '🟢 Lowest Risk — Routine Protection May Not Be Needed',
    riskClass: 'risk-low',
    tips: [
      { icon: '🧴', title: 'Sunscreen Optional', text: 'Routine sunscreen is not generally required, but consider it for very extended outdoor activities when UV index is ≥3.' },
      { icon: '👕', title: 'Cover for Long Exposure', text: 'For prolonged time outdoors, covering clothing helps prevent photoaging and pigmentation changes.' },
      { icon: '🕶️', title: 'Sunglasses Always', text: 'Always wear sunglasses outdoors. Eye damage from UV radiation affects all skin types.' },
      { icon: '☀️', title: 'Vitamin D — High Priority', text: 'You face significantly higher risk of vitamin D deficiency. Spend ample time outdoors with skin exposed. You likely need 2–4 times more sun exposure than lighter skin types.' },
      { icon: '🥗', title: 'Vitamin D Foods', text: 'Regularly eat vitamin D-rich foods: oily fish (salmon, tuna, sardines), eggs, meat, and fortified cereals or milk.' },
      { icon: '💊', title: 'Supplements Strongly Advised', text: 'If outdoor time is limited — especially in southern Australia in winter — vitamin D supplements are strongly recommended. Discuss with your doctor.' },
      { icon: '🌅', title: 'Morning Outdoor Time', text: 'Early morning light before 7am supports mood, sleep, and circadian health without UV risk.' },
    ]
  },
]

// Resources
const webLinks = [
  { title: 'Frequently Asked Questions — Sun Exposure', source: 'ARPANSA', url: 'https://www.arpansa.gov.au/understanding-radiation/radiation-sources/more-radiation-sources/sun-exposure/frequently-asked-questions' },
  { title: 'Protect Your Skin in 5 Ways', source: 'Cancer Institute NSW', url: 'https://www.cancer.nsw.gov.au/prevention-and-screening/preventing-cancer/preventing-skin-cancer/reduce-your-skin-cancer-risk/protect-your-skin-in-5-ways#5Ways' },
  { title: 'How Does the Sun Affect Different Skin Types?', source: 'Sun Doctors', url: 'https://sundoctors.com.au/blog/how-does-the-sun-affect-different-skin-types/' },
]

const pdfLinks = [
  { title: 'Fitzpatrick Skin Phototype', source: 'ARPANSA', url: '/resource2.pdf' },
  { title: 'Balancing the Harms and Benefits of Sun Exposure', source: 'ASSC Position Statement', url: '/resource1.pdf' },
]
</script>

<style scoped>
.learn-page {
  padding-top: var(--space-2xl);
  padding-bottom: var(--space-2xl);
}

.page-header { margin-bottom: var(--space-xl); }
.page-header h1 { font-size: 2rem; font-weight: 800; margin-bottom: var(--space-xs); }
.sub { color: var(--color-text-secondary); }

/* Quiz Card */
.quiz-card {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  background: #f0f0f0;
  margin-bottom: var(--space-xl);
}

.quiz-left img { width: 280px; height: 100%; object-fit: cover; display: block; }

.quiz-right {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.quiz-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #f0c040);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.4rem 1.2rem;
  border-radius: 8px;
  width: fit-content;
}

.quiz-question { font-weight: 700; font-size: 1.1rem; }
.quiz-options { display: flex; flex-direction: column; gap: 0.5rem; }
.quiz-options label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.quiz-bottom { display: flex; align-items: center; gap: 1.5rem; margin-top: 0.5rem; }

.quiz-submit {
  background: #2196f3;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.quiz-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.correct { color: green; font-weight: 600; }
.wrong { color: red; font-weight: 600; }
.explanation { font-size: 0.9rem; color: #555; margin-top: 0.5rem; }
.explanation-label { display: block; font-weight: 700; margin-bottom: 0.25rem; }

/* Myths Card */
.myths-card {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  background: #e8eef4;
  margin-bottom: var(--space-xl);
}

.myths-left { flex: 1; padding: 2rem; }

.myths-title-box {
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #f0c040);
  border-radius: 8px;
  padding: 0.4rem 1.2rem;
  margin-bottom: 1.2rem;
}

.myths-title-box h3 { color: white; font-weight: 700; font-size: 1rem; margin: 0; }
.myths-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; }

.myths-list li {
  cursor: pointer;
  font-size: 0.95rem;
  color: #222;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.myths-list li:hover { background: rgba(255,255,255,0.6); color: #1a4a7a; }
.myths-right { width: 340px; flex-shrink: 0; }
.myths-right img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 480px;
  width: 90%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.modal h4 { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; padding-right: 1.5rem; }
.modal p { font-size: 0.9rem; color: #444; line-height: 1.6; }

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #888;
}

.modal-close:hover { color: #222; }

/* Skin Type Quiz */
.skin-quiz-card {
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  margin-bottom: var(--space-xl);
}

.skin-quiz-title-box {
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #f0c040);
  border-radius: 8px;
  padding: 0.4rem 1.2rem;
  margin-bottom: 0.75rem;
}

.skin-quiz-title-box h3 { color: white; font-weight: 700; font-size: 1rem; margin: 0; }
.skin-quiz-intro { font-size: 0.9rem; color: #666; margin-bottom: 1.5rem; line-height: 1.6; }

.step-indicator { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ddd;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.step-dot.active { background: #f5a623; color: white; }
.step-dot.done { background: #4caf50; color: white; }
.step-label { font-weight: 600; font-size: 1rem; color: #333; margin-left: 0.5rem; }
.skin-question-block { margin-bottom: 1.5rem; }
.skin-question-text { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.75rem; color: #222; }
.skin-options { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.skin-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
  background: white;
}

.skin-option:hover { border-color: #f5a623; }
.skin-option.selected { border-color: #f5a623; background: #fff8ee; }

.skin-option-score {
  background: #f5a623;
  color: white;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.skin-nav { display: flex; gap: 1rem; margin-top: 1rem; }

.skin-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

.skin-btn.primary { background: #f5a623; color: white; }
.skin-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }
.skin-btn.secondary { background: #eee; color: #444; }
.skin-btn.reset { background: #fff; color: #f5a623; border: 2px solid #f5a623; }

.skin-result-block { display: flex; border-radius: 12px; overflow: hidden; color: white; }

.skin-result-left {
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  background: rgba(0,0,0,0.15);
}

.skin-result-score { font-size: 2rem; font-weight: 800; }
.skin-result-type { font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem; }
.skin-result-right { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 0.4rem; }
.skin-result-name { font-size: 1.4rem; font-weight: 800; }
.skin-result-desc { font-size: 0.9rem; }
.skin-result-example { font-size: 0.85rem; opacity: 0.85; }

/* Sun Protection Advice */
.advice-card {
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  margin-bottom: var(--space-xl);
}

.advice-title-box {
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #f0c040);
  border-radius: 8px;
  padding: 0.4rem 1.2rem;
  margin-bottom: 0.75rem;
}

.advice-title-box h3 { color: white; font-weight: 700; font-size: 1rem; margin: 0; }
.advice-intro { font-size: 0.9rem; color: #666; margin-bottom: 1.25rem; }

.advice-type-selector { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }

.advice-type-btn {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  border: 2px solid #ddd;
  background: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  color: #444;
}

.advice-type-btn:hover { border-color: #f5a623; color: #f5a623; }

.advice-skin-label {
  display: inline-block;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.3rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.advice-risk-badge {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  margin-bottom: 1.25rem;
}

.risk-high { background: #fde8e8; color: #c0392b; }
.risk-medium { background: #fef9e7; color: #b7770d; }
.risk-low { background: #eafaf1; color: #1e8449; }

.advice-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.advice-item-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
}

.advice-item-icon { font-size: 1.4rem; flex-shrink: 0; }
.advice-item-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.2rem; color: #222; }
.advice-item-text { font-size: 0.82rem; color: #555; line-height: 1.5; }

/* Resources */
.resources-card {
  background: #fafafa;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  margin-top: var(--space-xl);
}

.resources-title-box {
  display: inline-block;
  background: linear-gradient(135deg, #f5a623, #f0c040);
  border-radius: 8px;
  padding: 0.4rem 1.2rem;
  margin-bottom: 1.25rem;
}

.resources-title-box h3 { color: white; font-weight: 700; font-size: 1rem; margin: 0; }

.resources-section-label {
  font-weight: 700;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.resource-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
  text-decoration: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.resource-item:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-color: #f5a623;
}

.resource-item-icon { font-size: 1.4rem; flex-shrink: 0; }
.resource-item-title { font-weight: 600; font-size: 0.9rem; color: #222; margin-bottom: 0.2rem; }
.resource-item-source { font-size: 0.8rem; color: #888; }
</style>