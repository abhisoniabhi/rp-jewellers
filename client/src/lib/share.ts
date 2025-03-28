export function shareRates() {
  if (navigator.share) {
    navigator.share({
      title: 'ShineRates - Current Gold and Silver Rates',
      text: 'Check out the latest gold and silver rates from ShineRates Premium!',
      url: window.location.href,
    })
    .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback for browsers that don't support Web Share API
    try {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Please copy this URL: ' + window.location.href);
    }
  }
}
