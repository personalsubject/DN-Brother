const SECRET_PASSWORD = "nmdnahid2020";

let currentTab = 'dashboard';
let filesData = [];

function appAuth() {
    const inputPass = document.getElementById('auth-password').value.trim();

    if (inputPass === SECRET_PASSWORD) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showMainApp();
    } else {
        alert("ভুল পাসওয়ার্ড!");
    }
}

function showMainApp() {
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('app-box').style.display = 'flex';
    loadUserData();
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    document.getElementById('app-box').style.display = 'none';
    document.getElementById('auth-box').style.display = 'block';
    document.getElementById('auth-password').value = '';
}

window.onload = function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showMainApp();
    }
};

function loadUserData() {
    const data = localStorage.getItem('my_personal_storage_files');
    filesData = data ? JSON.parse(data) : [];
    updateDashboard();
    renderFiles();
}

function saveUserData() {
    localStorage.setItem('my_personal_storage_files', JSON.stringify(filesData));
    updateDashboard();
    renderFiles();
}

function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileObj = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                rawSize: file.size,
                type: getFileCategory(file.type, file.name),
                data: e.target.result,
                date: new Date().toLocaleDateString('bn-BD'),
                selected: false
            };
            filesData.push(fileObj);
            saveUserData();
        };
        reader.readAsDataURL(file);
    }
}

function getFileCategory(mimeType, filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'photos';
    if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'webm'].includes(ext)) return 'videos';
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) return 'music';
    if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
    return 'other';
}

function updateDashboard() {
    document.getElementById('cnt-total').innerText = filesData.length;
    document.getElementById('cnt-photos').innerText = filesData.filter(f => f.type === 'photos').length;
    document.getElementById('cnt-videos').innerText = filesData.filter(f => f.type === 'videos').length;
    document.getElementById('cnt-music').innerText = filesData.filter(f => f.type === 'music').length;
    document.getElementById('cnt-pdf').innerText = filesData.filter(f => f.type === 'pdf').length;

    const totalBytes = filesData.reduce((sum, f) => sum + (f.rawSize || 0), 0);
    document.getElementById('cnt-size').innerText = (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(event && event.target) {
        event.target.closest('.nav-btn').classList.add('active');
    }
    
    document.getElementById('dashboard-view').style.display = (tab === 'dashboard') ? 'block' : 'none';
    document.getElementById('section-title').innerText = tab.toUpperCase();
    renderFiles();
}

function renderFiles() {
    const grid = document.getElementById('file-grid');
    grid.innerHTML = '';

    const filtered = (currentTab === 'dashboard' || currentTab === 'all') 
        ? filesData 
        : filesData.filter(f => f.type === currentTab);

    filtered.forEach(file => {
        const card = document.createElement('div');
        card.className = `file-card ${file.selected ? 'selected' : ''}`;
        
        let previewHtml = `<i class="fa-solid fa-file"></i>`;
        if (file.type === 'photos') previewHtml = `<img src="${file.data}" alt="${file.name}">`;
        else if (file.type === 'videos') previewHtml = `<i class="fa-solid fa-film"></i>`;
        else if (file.type === 'music') previewHtml = `<i class="fa-solid fa-compact-disc"></i>`;
        else if (file.type === 'pdf') previewHtml = `<i class="fa-solid fa-file-lines"></i>`;

        card.innerHTML = `
            <input type="checkbox" class="file-checkbox" ${file.selected ? 'checked' : ''} onchange="toggleSelect(${file.id})">
            <div class="file-preview" onclick="previewFile(${file.id})">${previewHtml}</div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div>${file.size} • ${file.date}</div>
            </div>
            <div class="file-actions">
                <i class="fa-solid fa-download" onclick="downloadSingle('${file.data}', '${file.name}')"></i>
                <i class="fa-solid fa-trash" onclick="deleteFile(${file.id})"></i>
            </div>
        `;
        grid.appendChild(card);
    });

    updateSelectedCount();
}

function toggleSelect(id) {
    const file = filesData.find(f => f.id === id);
    if (file) file.selected = !file.selected;
    saveUserData();
}

function selectAllFiles() {
    filesData.forEach(f => f.selected = true);
    saveUserData();
}

function clearSelection() {
    filesData.forEach(f => f.selected = false);
    saveUserData();
}

function updateSelectedCount() {
    const count = filesData.filter(f => f.selected).length;
    document.getElementById('selected-count').innerText = `${count} টি ফাইল সিলেক্টেড`;
}

function deleteFile(id) {
    filesData = filesData.filter(f => f.id !== id);
    saveUserData();
}

function downloadSingle(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

function downloadSelected() {
    const selected = filesData.filter(f => f.selected);
    if (selected.length === 0) {
        alert("কোনো ফাইল সিলেক্ট করা হয়নি!");
        return;
    }
    selected.forEach(file => downloadSingle(file.data, file.name));
}

function previewFile(id) {
    const file = filesData.find(f => f.id === id);
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    if (file.type === 'photos') body.innerHTML = `<img src="${file.data}" style="max-width:100%; border-radius:8px;">`;
    else if (file.type === 'videos') body.innerHTML = `<video src="${file.data}" controls style="max-width:100%; border-radius:8px;"></video>`;
    else if (file.type === 'music') body.innerHTML = `<audio src="${file.data}" controls style="width:100%;"></audio>`;
    else body.innerHTML = `<p style="color:#fff;">${file.name}</p><br><a class="btn primary" href="${file.data}" download="${file.name}">ডাউনলোড করুন</a>`;

    document.getElementById('preview-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('preview-modal').style.display = 'none';
                            }
