// DOM Elements
const fileInput = document.getElementById("file-input");
const fileName = document.getElementById("file-name");
const analyzeButton = document.getElementById("analyze-button");
const loadingSpinner = document.querySelector(".loading-spinner");
const colorCodesDiv = document.getElementById("color-codes");
const languageSelect = document.getElementById("language-select");

// Constants
const MAX_DIMENSION = 300;
const SAMPLE_RATE = 10;
const MAX_COLORS = 5;
const LOADING_TIME = 1000;

// Translations
const translations = {
  en: {
    fileName: "No file selected",
    analyzeButton: "Check colors",
    copyAlert: "Color code ({color}) copied!",
    copyError: "Error copying color:",
  },
  hu: {
    fileName: "Nincs kiválasztott fájl",
    analyzeButton: "Színek kinyerése",
    copyAlert: "A színkód ({color}) a vágólapra másolva!",
    copyError: "Hiba a másolás során:",
  },
};

// File selection
fileInput.addEventListener("change", () => {
  const selectedFile = fileInput.files[0];
  fileName.textContent = selectedFile
    ? selectedFile.name
    : translations[languageSelect.value].fileName;
  analyzeButton.disabled = !selectedFile;
});

// Analyze image
analyzeButton.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return;

  loadingSpinner.style.display = "block";
  analyzeButton.disabled = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const colors = processImage(img);
      setTimeout(() => {
        displayColors(colors);
        loadingSpinner.style.display = "none";
        analyzeButton.disabled = false;
      }, LOADING_TIME);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Process image
function processImage(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { width, height } = resizeImage(img);

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height).data;
  return extractColors(imageData);
}

// Resize image
function resizeImage(img) {
  const aspectRatio = img.width / img.height;
  return img.width > img.height
    ? { width: MAX_DIMENSION, height: MAX_DIMENSION / aspectRatio }
    : { width: MAX_DIMENSION * aspectRatio, height: MAX_DIMENSION };
}

// Extract colors
function extractColors(data) {
  const colors = {};
  for (let i = 0; i < data.length; i += 4 * SAMPLE_RATE) {
    const color = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
    colors[color] = (colors[color] || 0) + 1;
  }
  return Object.keys(colors)
    .sort((a, b) => colors[b] - colors[a])
    .slice(0, MAX_COLORS);
}

// Display colors
function displayColors(colors) {
  colorCodesDiv.innerHTML = colors
    .map(
      (color) => `
      <div class="color-box" style="background-color: ${color}" onclick="copyColor('${color}')">
      </div>`
    )
    .join("");
}

// Copy color
function copyColor(color) {
  navigator.clipboard
    .writeText(color)
    .then(() =>
      alert(
        translations[languageSelect.value].copyAlert.replace("{color}", color)
      )
    )
    .catch((err) =>
      console.error(translations[languageSelect.value].copyError, err)
    );
}

// Language selection
languageSelect.addEventListener("change", () => {
  fileName.textContent = translations[languageSelect.value].fileName;
  analyzeButton.textContent = translations[languageSelect.value].analyzeButton;
});
