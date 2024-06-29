// DOM elemek kiválasztása
var fileInput = document.getElementById('file-input');
var fileName = document.getElementById('file-name');
var analyzeButton = document.getElementById('analyze-button');
var loadingSpinner = document.querySelector('.loading-spinner');
var colorCodesDiv = document.getElementById('color-codes');
var languageSelect = document.getElementById('language-select');

// Konstansok
var MAX_DIMENSION = 300;
var SAMPLE_RATE = 10;
var TOLERANCE = 0.05;
var MAX_COLORS = 5;
var LOADING_TIME = 1000; // 1 second forced loading time

// Nyelvek és fordítások
var translations = {
	en: {
		title: 'Image Upload',
		description: 'Upload an image to extract the visible color codes (5 colors).',
		fileName: 'No file selected',
		analyzeButton: 'Check colors',
		credit: 'made by <a href="https://github.com/DanCodernaut" target="_blank">DanCodernaut 🪄</a>',
		copyAlert: 'Color code ({color}) copied to clipboard!',
		copyError: 'Error copying to clipboard:',
	},
	hu: {
		title: 'Kép Feltöltés',
		description: 'Tölts fel egy képet, hogy kinyerhesd a rajta látható színkódokat (5 szín).',
		fileName: 'Nincs kiválasztott fájl',
		analyzeButton: 'Színek kinyerése',
		credit: 'made by <a href="https://github.com/DanCodernaut" target="_blank">DanCodernaut 🪄</a>',
		copyAlert: 'A színkód ({color}) a vágólapra másolva!',
		copyError: 'Hiba a másolás során:',
	},
	de: {
		title: 'Bild Hochladen',
		description: 'Laden Sie ein Bild hoch, um die sichtbaren Farbcodes zu extrahieren (5 Farben).',
		fileName: 'Keine Datei ausgewählt',
		analyzeButton: 'Farben extrahieren',
		credit: 'made by <a href="https://github.com/DanCodernaut" target="_blank">DanCodernaut 🪄</a>',
		copyAlert: 'Farbcode ({color}) in die Zwischenablage kopiert!',
		copyError: 'Fehler beim Kopieren in die Zwischenablage:',
	},
	fr: {
		title: "Téléchargement d'image",
		description: 'Téléchargez une image pour extraire les codes de couleur visibles (5 couleurs).',
		fileName: 'Aucun fichier sélectionné',
		analyzeButton: 'Extraire les couleurs',
		credit: 'made by <a href="https://github.com/DanCodernaut" target="_blank">DanCodernaut 🪄</a>',
		copyAlert: 'Code couleur ({color}) copié dans le presse-papiers !',
		copyError: 'Erreur lors de la copie dans le presse-papiers :',
	},
};

// Fájl kiválasztása esemény kezelése
fileInput.addEventListener('change', function () {
	var selectedFile = fileInput.files[0];
	if (selectedFile) {
		fileName.textContent = selectedFile.name;
		analyzeButton.classList.add('active');
		analyzeButton.disabled = false;
	} else {
		fileName.textContent = translations[languageSelect.value].fileName;
		analyzeButton.classList.remove('active');
		analyzeButton.disabled = true;
	}
});

// Kép elemzése és színek kinyerése
analyzeButton.addEventListener('click', function () {
	loadingSpinner.style.display = 'inline-block';
	analyzeButton.classList.add('loading');
	analyzeButton.disabled = true;

	var file = fileInput.files[0];
	var reader = new FileReader();

	reader.onload = function (event) {
		var img = new Image();
		img.onload = function () {
			var startTime = Date.now();
			var colors = processImage(img);

			// Kényszerített betöltési idő hozzáadása
			var elapsedTime = Date.now() - startTime;
			var remainingTime = Math.max(0, LOADING_TIME - elapsedTime);

			setTimeout(function () {
				displayColors(colors);
				loadingSpinner.style.display = 'none';
				analyzeButton.classList.remove('loading');
				analyzeButton.disabled = false;
			}, remainingTime);
		};
		img.src = event.target.result;
	};

	reader.readAsDataURL(file);
});

// Kép feldolgozása
function processImage(img) {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	var dimensions = calculateDimensions(img);

	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

	var imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height).data;
	return extractColors(imageData);
}

// Kép méretének kiszámítása
function calculateDimensions(img) {
	var aspectRatio = img.width / img.height;
	if (img.width > img.height) {
		return { width: MAX_DIMENSION, height: MAX_DIMENSION / aspectRatio };
	} else {
		return { width: MAX_DIMENSION * aspectRatio, height: MAX_DIMENSION };
	}
}

// Színek kinyerése a képből
function extractColors(data) {
	var colorCounts = {};
	for (var i = 0; i < data.length; i += 4 * SAMPLE_RATE) {
		var color = 'rgb(' + data[i] + ', ' + data[i + 1] + ', ' + data[i + 2] + ')';
		var similarColor = findSimilarColor(color, colorCounts);
		colorCounts[similarColor] = (colorCounts[similarColor] || 0) + 1;
	}

	// Színek rendezése előfordulás szerint
	var sortedColors = Object.keys(colorCounts).sort(function (a, b) {
		return colorCounts[b] - colorCounts[a];
	});

	return sortedColors.slice(0, MAX_COLORS);
}

// Hasonló szín keresése
function findSimilarColor(color, colorCounts) {
	var rgb1 = color.match(/\d+/g);
	var maxDistance = 255 * Math.sqrt(3) * TOLERANCE;

	for (var existingColor in colorCounts) {
		var rgb2 = existingColor.match(/\d+/g);
		var distance = Math.sqrt(
			Math.pow(rgb1[0] - rgb2[0], 2) +
				Math.pow(rgb1[1] - rgb2[1], 2) +
				Math.pow(rgb1[2] - rgb2[2], 2)
		);
		if (distance < maxDistance) return existingColor;
	}
	return color;
}

// Színek megjelenítése
function displayColors(colors) {
	var html = '';
	for (var i = 0; i < colors.length; i++) {
		html +=
			'<div class="color-box" style="background-color: ' +
			colors[i] +
			'" title="' +
			colors[i] +
			'" onclick="copyToClipboard(\'' +
			colors[i] +
			'\')"></div>';
	}
	colorCodesDiv.innerHTML = html;
}

// Színkód másolása a vágólapra
function copyToClipboard(color) {
	navigator.clipboard
		.writeText(color)
		.then(function () {
			alert(translations[languageSelect.value].copyAlert.replace('{color}', color));
		})
		.catch(function (err) {
			console.error(translations[languageSelect.value].copyError, err);
		});
}

// Nyelvválasztó eseménykezelése
languageSelect.addEventListener('change', function () {
	var selectedLanguage = languageSelect.value;
	translate(selectedLanguage);
});

// Fordítás függvény
function translate(language) {
	document.documentElement.lang = language;
	document.querySelector('h1').textContent = translations[language].title;
	document.querySelector('p').textContent = translations[language].description;
	fileName.textContent = translations[language].fileName;
	analyzeButton.querySelector('span').textContent = translations[language].analyzeButton;
	document.querySelector('.credit').innerHTML = translations[language].credit;
}

// Zászlók hozzáadása a nyelvválasztóhoz
function addFlagsToSelect() {
	var options = languageSelect.querySelectorAll('option');
	for (var i = 0; i < options.length; i++) {
		var option = options[i];
		var flag = option.dataset.flag;
		option.style.backgroundImage = 'url(' + flag + ')';
		option.style.backgroundRepeat = 'no-repeat';
		option.style.backgroundPosition = '5px center';
		option.style.backgroundSize = '20px 14px';
		option.style.paddingLeft = '30px';
	}
}

// Kezdeti beállítások
translate('en');
addFlagsToSelect();
