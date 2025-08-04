<template>
    <video autoplay muted loop id="video-bg">
      <source src="/bg-video.mp4" type="video/mp4">
    </video>
    <div class="container">
        <div class="label">
            Home Page
        </div>
        <div class="description">
            Вход на <RouterLink to="/login">/login</RouterLink>
        </div>
    </div>
</template>
<script>
import { RouterLink } from 'vue-router';

</script>
<style>
a, link {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
    font-family: 'Roboto';
    font-weight: 700;
}

#video-bg {
  position: fixed;
  right: 0;
  top: -4vw;
  min-width: 100%;
  min-height: 100%;
  z-index: -100;
  opacity: 0.7;
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1vw;
    height: 80vh;
    width: 90vw;
}

.description{
    position: relative;
    top: -2vw;
    height: fit-content;
    width: fit-content;
    font-size: 1rem;
    font-family: 'Roboto';
    text-align: top;
    z-index: 100;
    color: #fff;
    font-weight: 700;
}

.label {
    height: fit-content;
    width: fit-content;
    font-family: 'Roboto';
    text-align: center;
    z-index: 100;
    color: #fff;
    font-size: 3.25rem;
    font-weight: 700;
}
</style>