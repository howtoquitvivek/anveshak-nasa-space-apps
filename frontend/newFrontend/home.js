document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      const links = document.querySelector('.sidebar-links');
      links.classList.toggle('d-none');
    });
  }

  const uploadArea = document.getElementById('upload-area');
  const uploadInput = document.getElementById('upload-input');
  const previewArea = document.getElementById('image-preview');
  const canvas = document.getElementById('annotation-canvas');
  const ctx = canvas.getContext('2d');
  const clearBtn = document.getElementById('clear-btn');
  let drawing = false;
  let currentTool = 'draw';
  let lastX = 0;
  let lastY = 0;
  let currentImage = null;
  let uploadedImages = [];

  uploadArea.addEventListener('click', () => { uploadInput.click(); });
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.background = '#e3ffe3';
    uploadArea.style.borderColor = '#1db954';
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '';
    uploadArea.style.borderColor = '';
  });
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.background = '';
    uploadArea.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });
  uploadInput.addEventListener('change', () => { handleFiles(uploadInput.files); });

  function handleFiles(files) {
    previewArea.innerHTML = '';
    uploadedImages = [];
    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const id = 'img_' + Date.now() + Math.random().toString(36).slice(2);
        uploadedImages.push({ id, src: e.target.result });
        addImagePreview(id, e.target.result);
        if (idx === 0) { currentImage = { id, src: e.target.result }; loadImageOnCanvas(currentImage.src); selectImage(id); }
      };
      reader.readAsDataURL(file);
    });
  }

  function addImagePreview(id, src) {
    const div = document.createElement('div');
    div.classList.add('preview-item');
    div.dataset.id = id;
    div.innerHTML = `<img src="${src}"/><button class="delete-btn" title="Delete">&times;</button>`;
    div.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); removeImage(id); };
    div.addEventListener('click', () => { selectImage(id); });
    previewArea.appendChild(div);
  }
  function removeImage(id) {
    uploadedImages = uploadedImages.filter(img => img.id !== id);
    const elem = previewArea.querySelector(`div[data-id="${id}"]`);
    if (elem) previewArea.removeChild(elem);
    if (currentImage && currentImage.id === id) { currentImage = null; clearCanvas(); }
  }
  function selectImage(id) {
    previewArea.querySelectorAll('.preview-item').forEach(el => el.classList.remove('selected'));
    const el = previewArea.querySelector(`div[data-id="${id}"]`);
    if (el) el.classList.add('selected');
    const imgData = uploadedImages.find(img => img.id === id);
    if (imgData) currentImage = imgData;
  }
  function loadImageOnCanvas(src) {
    const img = new Image();
    img.onload = () => {
      clearCanvas();
      let w = img.width, h = img.height;
      const maxW = canvas.width - 40, maxH = canvas.height - 40;
      if (w > maxW) { h *= maxW / w; w = maxW; }
      if (h > maxH) { w *= maxH / h; h = maxH; }
      const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = src;
  }
  document.getElementById('add-image-btn').onclick = () => {
    if (!currentImage) { alert('Select an image first.'); return; }
    loadImageOnCanvas(currentImage.src);
  };
  function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

  function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('#annotation-tools button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tool + '-btn').classList.add('active');
  }
  document.getElementById('draw-btn').onclick = () => setTool('draw');
  document.getElementById('highlight-btn').onclick = () => setTool('highlight');
  document.getElementById('erase-btn').onclick = () => setTool('erase');
  setTool('draw');
  canvas.addEventListener('mousedown', (e) => { drawing = true; lastX = e.offsetX; lastY = e.offsetY; });
  canvas.addEventListener('mouseup', () => { drawing = false; });
  canvas.addEventListener('mouseout', () => { drawing = false; });
  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (currentTool === 'draw') { ctx.strokeStyle = '#1db954'; ctx.lineWidth = 3; }
    else if (currentTool === 'highlight') { ctx.strokeStyle = 'rgba(255,255,0,0.5)'; ctx.lineWidth = 15; }
    else if (currentTool === 'erase') { ctx.clearRect(e.offsetX - 10, e.offsetY - 10, 20, 20); return; }
    ctx.beginPath();
    ctx.moveTo(lastX, lastY); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
    lastX = e.offsetX; lastY = e.offsetY;
  });
  clearBtn.onclick = () => clearCanvas();
  document.getElementById('save-btn').onclick = () => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'annotation.png'; a.click();
    alert('Annotation saved as image.');
  };
  document.getElementById('share-btn').onclick = async () => {
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
      alert('Annotation image copied to clipboard! Paste in chat/email/documents.');
    } catch (error) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'annotation.png'; a.click();
      alert('Clipboard sharing not supported; image downloaded.');
    }
  };
  document.getElementById('add-user-btn').onclick = () => {
    const email = prompt('Enter user email:');
    if(email) alert(`User ${email} added to workspace.`);
  };
});
