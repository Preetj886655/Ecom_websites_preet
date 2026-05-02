// assets/js/hero.js
// Auto-rotates hero banner images every 4 seconds
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.image-rotator img');
  if (!images.length) return;

  let current = 0;

  function nextImage() {
    images[current].classList.remove('active');
    current = (current + 1) % images.length;
    images[current].classList.add('active');
  }

  // Ensure first image is active
  images[0].classList.add('active');
  setInterval(nextImage, 4000);
});
