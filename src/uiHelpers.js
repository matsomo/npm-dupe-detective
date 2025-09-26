const loader = document.getElementById("loader");

export function showLoader(message = "Loading...") {
  document.getElementById("loader-message").textContent = message;
  loader.style.display = "flex";
}

export function hideLoader() {
  loader.style.display = "none";
}
