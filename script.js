const DB_NAME =
"MyStorageHubDB";

const STORE =
"files";


let db;

let currentUser =
null;

let currentCategory =
"all";

let selected =
new Set();

let visibleFiles =
[];



/* DATABASE */

function initDB() {

  return new Promise(
    (resolve, reject) => {

      const request =
      indexedDB.open(
        DB_NAME,
        1
      );


      request.onupgradeneeded =
      function(event) {

        const database =
        event.target.result;


        database.createObjectStore(
          STORE,
          {
            keyPath: "id",
            autoIncrement: true
          }
        );

      };


      request.onsuccess =
      function(event) {

        db =
        event.target.result;

        resolve();

      };


      request.onerror =
      function() {

        reject();

      };

    }
  );

}



/* USERS */

function users() {

  return JSON.parse(
    localStorage.getItem(
      "storageHubUsers"
    ) || "[]"
  );

}


function saveUsers(
  data
) {

  localStorage.setItem(
    "storageHubUsers",
    JSON.stringify(data)
  );

}



/* LOGIN PAGE */

function showRegister() {

  loginBox.classList.add(
    "hidden"
  );

  registerBox.classList.remove(
    "hidden"
  );

}


function showLogin() {

  registerBox.classList.add(
    "hidden"
  );

  loginBox.classList.remove(
    "hidden"
  );

}



/* REGISTER */

function register() {

  const id =
  regEmail.value.trim();

  const password =
  regPassword.value;


  if (
    !id ||
    password.length < 4
  ) {

    toast(
      "সঠিক তথ্য দিন"
    );

    return;

  }


  const userList =
  users();


  if (
    userList.some(
      user =>
      user.id === id
    )
  ) {

    toast(
      "এই Account আগে থেকেই আছে"
    );

    return;

  }


  userList.push({
    id: id,
    pass: password
  });


  saveUsers(
    userList
  );


  toast(
    "Account তৈরি হয়েছে"
  );


  showLogin();

}



/* LOGIN */

function login() {

  const id =
  loginEmail.value.trim();

  const password =
  loginPassword.value;


  const found =
  users().some(
    user =>
    user.id === id &&
    user.pass === password
  );


  if (found) {

    currentUser =
    id;


    localStorage.setItem(
      "storageHubCurrentUser",
      id
    );


    startApp();

  }

  else {

    toast(
      "Login তথ্য ভুল"
    );

  }

}



/* LOGOUT */

function logout() {

  localStorage.removeItem(
    "storageHubCurrentUser"
  );


  currentUser =
  null;


  app.classList.add(
    "hidden"
  );


  authPage.classList.remove(
    "hidden"
  );

}



/* START */

function startApp() {

  authPage.classList.add(
    "hidden"
  );


  app.classList.remove(
    "hidden"
  );


  userName.textContent =
  currentUser;


  loadFiles();

}



/* UPLOAD MODAL */

function openUpload() {

  uploadModal.classList.remove(
    "hidden"
  );

}


function closeUpload() {

  uploadModal.classList.add(
    "hidden"
  );


  fileInput.value =
  "";


  chosenFiles.textContent =
  "কোনো File নির্বাচন করা হয়নি";

}



/* SHOW FILE */

function showChosenFiles() {

  const files =
  [...fileInput.files];


  if (!files.length) {

    chosenFiles.textContent =
    "কোনো File নির্বাচন করা হয়নি";

    return;

  }


  chosenFiles.innerHTML =
  files.map(
    file =>
    "📄 " +
    file.name +
    " (" +
    formatBytes(
      file.size
    ) +
    ")"
  ).join(
    "<br>"
  );

}



/* CATEGORY */

function categoryOf(
  file
) {

  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    return "photo";

  }


  if (
    file.type.startsWith(
      "video/"
    )
  ) {

    return "video";

  }


  if (
    file.type.startsWith(
      "audio/"
    )
  ) {

    return "music";

  }


  if (
    file.type ===
    "application/pdf"
  ) {

    return "pdf";

  }


  return "other";

}



/* UPLOAD */

function uploadFiles() {

  const files =
  [...fileInput.files];


  if (!files.length) {

    toast(
      "আগে File নির্বাচন করুন"
    );

    return;

  }


  const transaction =
  db.transaction(
    STORE,
    "readwrite"
  );


  const store =
  transaction.objectStore(
    STORE
  );


  files.forEach(
    file => {

      store.add({

        user:
        currentUser,

        name:
        file.name,

        type:
        file.type,

        size:
        file.size,

        category:
        categoryOf(file),

        blob:
        file,

        created:
        Date.now()

      });

    }
  );


  transaction.oncomplete =
  function() {

    toast(
      files.length +
      "টি File Upload হয়েছে"
    );


    closeUpload();


    loadFiles();

  };

}



/* GET FILES */

function getUserFiles() {

  return new Promise(
    resolve => {

      const request =
      db
      .transaction(
        STORE
      )
      .objectStore(
        STORE
      )
      .getAll();


      request.onsuccess =
      function() {

        const files =
        request.result.filter(
          file =>
          file.user ===
          currentUser
        );


        resolve(
          files
        );

      };

    }
  );

}



/* LOAD FILE */

async function loadFiles() {

  const allFiles =
  await getUserFiles();


  updateStats(
    allFiles
  );


  if (
    currentCategory ===
    "all"
  ) {

    visibleFiles =
    allFiles;

  }

  else {

    visibleFiles =
    allFiles.filter(
      file =>
      file.category ===
      currentCategory
    );

  }


  renderFiles();

}



/* STATISTICS */

function updateStats(
  files
) {

  totalFiles.textContent =
  files.length;


  photoCount.textContent =
  files.filter(
    file =>
    file.category ===
    "photo"
  ).length;


  videoCount.textContent =
  files.filter(
    file =>
    file.category ===
    "video"
  ).length;


  const totalSize =
  files.reduce(
    (total, file) =>
    total + file.size,
    0
  );


  storageUsed.textContent =
  formatBytes(
    totalSize
  );

}



/* CHANGE CATEGORY */

function setCategory(
  category
) {

  currentCategory =
  category;


  selected.clear();


  document
  .querySelectorAll(
    ".category"
  )
  .forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.cat ===
        category
      );

    }
  );


  const titles = {

    all:
    "All Files",

    photo:
    "Photos",

    video:
    "Videos",

    music:
    "Music",

    pdf:
    "PDF Files",

    other:
    "Other Files"

  };


  sectionTitle.textContent =
  titles[category];


  loadFiles();

}



/* ICON */

function getIcon(
  category
) {

  const icons = {

    photo:
    "🖼️",

    video:
    "🎥",

    music:
    "🎵",

    pdf:
    "📄",

    other:
    "📁"

  };


  return icons[category];

}



/* RENDER FILES */

function renderFiles() {

  fileGrid.innerHTML =
  "";


  if (
    visibleFiles.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

  }

  else {

    emptyState.classList.add(
      "hidden"
    );

  }


  visibleFiles.forEach(
    file => {

      const card =
      document.createElement(
        "article"
      );


      card.className =
      "file-card";


      /* Checkbox */

      const checkbox =
      document.createElement(
        "input"
      );


      checkbox.type =
      "checkbox";


      checkbox.className =
      "check";


      checkbox.checked =
      selected.has(
        file.id
      );


      checkbox.onchange =
      function() {

        toggleFile(
          file.id,
          checkbox.checked
        );

      };


      card.appendChild(
        checkbox
      );



      /* Preview */

      const preview =
      document.createElement(
        "div"
      );


      preview.className =
      "preview";


      if (
        file.category ===
        "photo"
      ) {

        const image =
        document.createElement(
          "img"
        );


        image.src =
        URL.createObjectURL(
          file.blob
        );


        preview.appendChild(
          image
        );

      }


      else if (
        file.category ===
        "video"
      ) {

        const video =
        document.createElement(
          "video"
        );


        video.src =
        URL.createObjectURL(
          file.blob
        );


        video.controls =
        true;


        preview.appendChild(
          video
        );

      }


      else {

        preview.textContent =
        getIcon(
          file.category
        );

      }


      card.appendChild(
        preview
      );



      /* Info */

      const info =
      document.createElement(
        "div"
      );


      info.className =
      "file-info";


      const fileName =
      document.createElement(
        "div"
      );


      fileName.className =
      "file-name";


      fileName.textContent =
      file.name;


      const meta =
      document.createElement(
        "div"
      );


      meta.className =
      "file-meta";


      meta.textContent =
      getIcon(
        file.category
      ) +
      " " +
      formatBytes(
        file.size
      );


      info.appendChild(
        fileName
      );


      info.appendChild(
        meta
      );



      /* Buttons */

      const actions =
      document.createElement(
        "div"
      );


      actions.className =
      "file-actions";


      const downloadButton =
      document.createElement(
        "button"
      );


      downloadButton.textContent =
      "⬇ Download";


      downloadButton.onclick =
      function() {

        downloadOne(
          file
        );

      };


      const deleteButton =
      document.createElement(
        "button"
      );


      deleteButton.textContent =
      "🗑";


      deleteButton.className =
      "delete-btn";


      deleteButton.onclick =
      function() {

        deleteFile(
          file.id
        );

      };


      actions.appendChild(
        downloadButton
      );


      actions.appendChild(
        deleteButton
      );


      info.appendChild(
        actions
      );


      card.appendChild(
        info
      );


      fileGrid.appendChild(
        card
      );

    }
  );


  updateSelectionInfo();

}



/* SELECT FILE */

function toggleFile(
  id,
  checked
) {

  if (checked) {

    selected.add(
      id
    );

  }

  else {

    selected.delete(
      id
    );

  }


  updateSelectionInfo();

}



/* SELECT ALL */

function toggleSelectAll() {

  const allSelected =
  visibleFiles.length > 0 &&
  visibleFiles.every(
    file =>
    selected.has(
      file.id
    )
  );


  visibleFiles.forEach(
    file => {

      if (allSelected) {

        selected.delete(
          file.id
        );

      }

      else {

        selected.add(
          file.id
        );

      }

    }
  );


  renderFiles();

}



/* CLEAR */

function clearSelection() {

  selected.clear();


  renderFiles();

}



/* SELECT INFO */

function updateSelectionInfo() {

  selectedInfo.textContent =
  selected.size +
  " file selected";


  downloadSelectedBtn.disabled =
  selected.size === 0;

}



/* DOWNLOAD ONE */

function downloadOne(
  file
) {

  const url =
  URL.createObjectURL(
    file.blob
  );


  const link =
  document.createElement(
    "a"
  );


  link.href =
  url;


  link.download =
  file.name;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    function() {

      URL.revokeObjectURL(
        url
      );

    },
    1000
  );

}



/* DOWNLOAD SELECTED */

async function downloadSelected() {

  const allFiles =
  await getUserFiles();


  const files =
  allFiles.filter(
    file =>
    selected.has(
      file.id
    )
  );


  if (!files.length) {

    return;

  }


  toast(
    files.length +
    "টি File Download শুরু হচ্ছে"
  );


  files.forEach(
    (
      file,
      index
    ) => {

      setTimeout(
        function() {

          downloadOne(
            file
          );

        },
        index * 500
      );

    }
  );

}



/* DELETE */

function deleteFile(
  id
) {

  const yes =
  confirm(
    "এই File Delete করতে চান?"
  );


  if (!yes) {

    return;

  }


  const transaction =
  db.transaction(
    STORE,
    "readwrite"
  );


  transaction
  .objectStore(
    STORE
  )
  .delete(
    id
  );


  transaction.oncomplete =
  function() {

    selected.delete(
      id
    );


    toast(
      "File Delete হয়েছে"
    );


    loadFiles();

  };

}



/* FORMAT SIZE */

function formatBytes(
  bytes
) {

  if (!bytes) {

    return "0 MB";

  }


  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];


  const index =
  Math.floor(
    Math.log(bytes) /
    Math.log(1024)
  );


  return (
    bytes /
    Math.pow(
      1024,
      index
    )
  ).toFixed(
    index ? 2 : 0
  ) +
  " " +
  units[index];

}



/* TOAST */

function toast(
  message
) {

  const toastBox =
  document.getElementById(
    "toast"
  );


  toastBox.textContent =
  message;


  toastBox.classList.add(
    "show"
  );


  clearTimeout(
    window.toastTimer
  );


  window.toastTimer =
  setTimeout(
    function() {

      toastBox.classList.remove(
        "show"
      );

    },
    3000
  );

}



/* START DATABASE */

window.addEventListener(
  "DOMContentLoaded",

  async function() {

    await initDB();


    const savedUser =
    localStorage.getItem(
      "storageHubCurrentUser"
    );


    if (savedUser) {

      currentUser =
      savedUser;


      startApp();

    }

  }

);
