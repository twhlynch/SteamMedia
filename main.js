const dropZone = document.getElementById("drop-zone");
const bgInput = document.getElementById("bg-input");
const logoZone = document.getElementById("logo-zone");
const logoInput = document.getElementById("logo-input");
const previewsContainer = document.getElementById("previews");
const mainScaleWrapper = document.getElementById("top-section");
const mainScaleSlider = document.getElementById("main-scale");
const resetBtn = document.getElementById("reset-btn");
const downloadAllBtn = document.getElementById("download-all");

const aspectRatios = [
  [290, 430], // Header Capsule
  [426, 174], // Small Capsule
  [1232, 706], // Main Capsule
  [748, 896], // Vertical Capsule
  [1438, 810], // Page Background
  [184, 184], // Community Icon
  [32, 32], // Client Icon
  [16, 16], // Client Image
  [155, 337], // Broadcast Side Panel
  [600, 900], // Library Capsule
  [3840, 1240], // Library Hero
  [1280, 720], // Library Logo
  [920, 430], // Library Header Capsule
  [800, 450], // Event Cover
  [1920, 622], // Event Header
  [2560, 1440], // meta: Landscape
  [1440, 1440], // meta: Square
  [1008, 1440], // meta: Portrait
  [3000, 900], // meta: Hero cover
  [512, 512], // meta: Icon
].sort((a, b) => a[0] / a[1] - b[0] / b[1]);

let logoScales = Array(aspectRatios.length).fill(0.6);
let logoExtraX = Array(aspectRatios.length).fill(0);
let logoExtraY = Array(aspectRatios.length).fill(0);

let bgImg = null;
let logoImg = null;
let logoPos = { x: 0.5, y: 0.5 };
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

let scaleSliders = [];
let xSliders = [];
let ySliders = [];
let canvases = [];

resetAll();

function downloadImage(i) {
  const canvas = canvases[i];
  const [w, h] = aspectRatios[i];

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${w}x${h}.png`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function reset(i) {
    logoExtraX[i] = 0;
    logoExtraY[i] = 0;
    logoScales[i] = 0.6;
    scaleSliders[i].value = 0.6;
    xSliders[i].value = 0;
    ySliders[i].value = 0;
}

function resetAll() {
  logoPos = { x: 0.5, y: 0.5 };

  canvases.forEach((_, i) => {
    reset(i);
  });

  mainScaleSlider.value = 0.6;
}

// MARK: main UI
mainScaleSlider.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  logoScales = logoScales.map(() => val);
  scaleSliders.forEach(slider => {
    slider.value = val;
  });
  renderAllPreviews();
});

resetBtn.addEventListener("click", () => {
  resetAll();
  renderAllPreviews();
});

downloadAllBtn.addEventListener("click", () => {
  aspectRatios.forEach((_, i) => {
    downloadImage(i);
  });
});

// MARK: previews
aspectRatios.forEach(([w, h], i) => {
  const wrapper = document.createElement("div");
  wrapper.className = "preview-wrapper";
  wrapper.style.aspectRatio = `${w} / ${h}`;

  // canvas
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  // buttons
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "⬇";
  downloadBtn.addEventListener("click", () => {
    downloadImage(i);
  });

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "↻";
  resetBtn.className = "reset-button";
  resetBtn.addEventListener("click", () => {
    reset(i);
    renderAllPreviews();
  });

  // sliders
  function createSlider(min, max, step, value) {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    return slider;
  }

  const slider = createSlider(0.1, 1, 0.01, logoScales[i]);
  slider.className = "scale"
  slider.addEventListener("input", (e) => {
    logoScales[i] = parseFloat(e.target.value);
    renderAllPreviews();
  });

  const xSlider = createSlider(-200, 200, 1, logoExtraX[i]);
  xSlider.className = "offsetX";
  xSlider.addEventListener("input", (e) => {
    logoExtraX[i] = parseInt(e.target.value);
    renderAllPreviews();
  });

  const ySlider = createSlider(-200, 200, 1, logoExtraY[i]);
  ySlider.className = "offsetY";
  ySlider.addEventListener("input", (e) => {
    logoExtraY[i] = -parseInt(e.target.value);
    renderAllPreviews();
  });

  wrapper.appendChild(canvas);
  wrapper.appendChild(downloadBtn);
  wrapper.appendChild(resetBtn);
  wrapper.appendChild(slider);
  wrapper.appendChild(xSlider);
  wrapper.appendChild(ySlider);

  canvases.push(canvas);
  scaleSliders.push(slider);
  xSliders.push(xSlider);
  ySliders.push(ySlider);

  previewsContainer.appendChild(wrapper);
});

// MARK: dropzones
dropZone.addEventListener("click", () => bgInput.click());
logoZone.addEventListener("click", () => logoInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.background = "#f0f0f0";
});
dropZone.addEventListener("dragleave", () => {
  dropZone.style.background = "";
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.background = "";
  const file = e.dataTransfer.files[0];
  handleImageFile(file, "bg");
});
bgInput.addEventListener("change", () => {
  const file = bgInput.files[0];
  handleImageFile(file, "bg");
});

logoZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  logoZone.style.background = "#f0f0f0";
});
logoZone.addEventListener("dragleave", () => {
  logoZone.style.background = "";
});
logoZone.addEventListener("drop", (e) => {
  e.preventDefault();
  logoZone.style.background = "";
  const file = e.dataTransfer.files[0];
  handleImageFile(file, "logo");
});
logoInput.addEventListener("change", () => {
  const file = logoInput.files[0];
  handleImageFile(file, "logo");
});

function handleImageFile(file, type) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        if (type === "bg") {
          bgImg = img;
        } else {
          logoImg = img;
        }
        renderAllPreviews();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// MARK: dragging
aspectRatios.forEach(([_w, _h], i) => {
  const canvas = canvases[i];
  canvas.addEventListener("mousedown", (e) => onLogoMouseDown(e, i));
  canvas.addEventListener("mousemove", (e) => onLogoMouseMove(e, i));
  canvas.addEventListener("mouseup", onLogoMouseUp);
  canvas.addEventListener("mouseleave", onLogoMouseUp);
  canvas.addEventListener("touchstart", (e) => onLogoMouseDown(e, i), { passive: false });
  canvas.addEventListener("touchmove", (e) => onLogoMouseMove(e, i), { passive: false });
  canvas.addEventListener("touchend", onLogoMouseUp, { passive: false });
  canvas.addEventListener("touchcancel", onLogoMouseUp, { passive: false });
});

function getEventPos(e, canvas) {
  let clientX, clientY;
  if (e.touches?.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

function onLogoMouseDown(e, i) {
  if (!logoImg) return;
  e.preventDefault();
  const canvas = canvases[i];
  const pos = getEventPos(e, canvas);

  const logoMaxWidth = canvas.width * logoScales[i];
  const logoScale = logoMaxWidth / logoImg.width;
  const logoWidth = logoImg.width * logoScale;
  const logoHeight = logoImg.height * logoScale;
  const logoX = logoPos.x * (canvas.width - logoWidth) + logoExtraX[i];
  const logoY = logoPos.y * (canvas.height - logoHeight) + logoExtraY[i];

  if (
    pos.x >= logoX &&
    pos.x <= logoX + logoWidth &&
    pos.y >= logoY &&
    pos.y <= logoY + logoHeight
  ) {
    isDragging = true;
    dragOffset.x = pos.x - logoX;
    dragOffset.y = pos.y - logoY;
  }
}

function onLogoMouseMove(e, i) {
  if (!isDragging || !logoImg) return;
  e.preventDefault();
  const canvas = canvases[i];
  const pos = getEventPos(e, canvas);

  const logoMaxWidth = canvas.width * logoScales[i];
  const logoScale = logoMaxWidth / logoImg.width;
  const logoWidth = logoImg.width * logoScale;
  const logoHeight = logoImg.height * logoScale;

  let newX = pos.x - dragOffset.x;
  let newY = pos.y - dragOffset.y;

  newX = Math.max(0, Math.min(newX, canvas.width - logoWidth));
  newY = Math.max(0, Math.min(newY, canvas.height - logoHeight));

  logoPos.x = (newX - logoExtraX[i]) / (canvas.width - logoWidth);
  logoPos.y = (newY - logoExtraY[i]) / (canvas.height - logoHeight);

  logoPos.x = Math.max(0, Math.min(logoPos.x, 1));
  logoPos.y = Math.max(0, Math.min(logoPos.y, 1));

  renderAllPreviews();
}

function onLogoMouseUp(_) {
  if (isDragging) {
    isDragging = false;
  }
}

// MARK: rendering
function renderAllPreviews() {
  aspectRatios.forEach(([_w, _h], i) => {
    const canvas = canvases[i];
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImg) {
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth, drawHeight, offsetX, offsetY;
      if (imgRatio > canvasRatio) {
        drawHeight = canvas.height;
        drawWidth = bgImg.width * (canvas.height / bgImg.height);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = bgImg.height * (canvas.width / bgImg.width);
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
    }

    if (logoImg) {
      const logoMaxWidth = canvas.width * logoScales[i];
      const logoScale = logoMaxWidth / logoImg.width;
      const logoWidth = logoImg.width * logoScale;
      const logoHeight = logoImg.height * logoScale;
      const logoX = logoPos.x * (canvas.width - logoWidth) + logoExtraX[i];
      const logoY = logoPos.y * (canvas.height - logoHeight) + logoExtraY[i];
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
    }
  });
}