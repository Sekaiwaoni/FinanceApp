<script setup>
import navBar from '@/components/navBar.vue';
import Salary from '@/components/Salary.vue';
import { useAuth } from '@/composables/useAuth';
import loginForm from '@/components/loginForm.vue';
const {
    isAuthenticated,
    checkAuthentication
} = useAuth()
checkAuthentication()
if (!isAuthenticated) {
    const guestdiv = document.querySelector('.guest');
    guestdiv.innerHTML = '<loginForm />';
} 
</script>
<template>
    <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/login">Логин</RouterLink>
        <RouterLink to="/registration">Рега</RouterLink>
        <RouterLink to="/expenses">Расходы</RouterLink>
        <RouterLink to="/">Расходы V2</RouterLink>
    </nav> -->
    <head>
        <link rel="shortcut icon" href=".../public/favicon.ico" type="image/x-icon" />
    </head>
    <main v-if="isAuthenticated">
        <div class="main-cont">
            <navBar />
            <Salary />
        </div>
        <RouterView />
    </main>
    <div class="guest" v-else>
    </div>
</template>
<style scoped>
.main-cont {
  display: grid;
  grid-template-columns: 1fr 6fr;
  gap: 30px;
  margin-bottom: 30px;
}
</style>
