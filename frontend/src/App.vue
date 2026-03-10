<template>
  <div id="app-root">
    <!-- Top navigation bar — hidden on welcome/login page -->
    <AppNavbar v-if="showNav" />

    <!-- Main content area — offset by navbar height when nav is visible -->
    <main :class="{ 'with-nav': showNav }">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/layout/AppNavbar.vue'

const route = useRoute()
const auth = useAuthStore()

const showNav = computed(() => !route.meta.hideNav)

// Restore session on app load
onMounted(() => {
  auth.checkSession()
})
</script>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

main.with-nav {
  padding-top: var(--nav-height);
}
</style>