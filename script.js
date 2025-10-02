// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX882cvhwQgfhbsLFn69Q2l-TUQUR5IBk",
  authDomain: "codingkan-factory-apps.firebaseapp.com",
  databaseURL: "https://codingkan-factory-apps-default-rtdb.firebaseio.com",
  projectId: "codingkan-factory-apps",
  storageBucket: "codingkan-factory-apps.firebasestorage.app",
  messagingSenderId: "188856222342",
  appId: "1:188856222342:android:ae0e1873684da414cec707",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// DOM Elements
const loginSection = document.getElementById("loginSection")
const adminSection = document.getElementById("adminSection")
const loginBtn = document.getElementById("loginBtn")
const logoutBtn = document.getElementById("logoutBtn")
const usersTableBody = document.getElementById("usersTableBody")
const caseList = document.getElementById("caseList")
const manageTableBody = document.getElementById("manageTableBody")
const warningTableBody = document.getElementById("warningTableBody")

// Form elements
const caseUID = document.getElementById("caseUID")
const studentName = document.getElementById("studentName")
const initialPoints = document.getElementById("initialPoints")
const caseReason = document.getElementById("caseReason")
const otherReason = document.getElementById("otherReason")
const otherReasonContainer = document.getElementById("otherReasonContainer")
const caseDetails = document.getElementById("caseDetails")
const casePoints = document.getElementById("casePoints")
const finalPoints = document.getElementById("finalPoints")
const addCaseBtn = document.getElementById("addCaseBtn")

// Search elements
const studentSearchInput = document.getElementById("studentSearchInput")
const caseSearchInput = document.getElementById("caseSearchInput")
const caseFilterType = document.getElementById("caseFilterType")
const manageSearchInput = document.getElementById("manageSearchInput")
const warningSearchInput = document.getElementById("warningSearchInput")

// Modal elements
const dialogOverlay = document.getElementById("dialogOverlay")
const dialogMessage = document.getElementById("dialogMessage")
const modalClose = document.getElementById("modalClose")
const modalOk = document.getElementById("modalOk")

const deleteModalOverlay = document.getElementById("deleteModalOverlay")
const deleteModalClose = document.getElementById("deleteModalClose")
const deleteModalCancel = document.getElementById("deleteModalCancel")
const deleteModalConfirm = document.getElementById("deleteModalConfirm")
const studentToDelete = document.getElementById("studentToDelete")

const resetModalOverlay = document.getElementById("resetModalOverlay")
const resetModalClose = document.getElementById("resetModalClose")
const resetModalCancel = document.getElementById("resetModalCancel")
const resetModalConfirm = document.getElementById("resetModalConfirm")
const resetValue = document.getElementById("resetValue")
const resetValueDisplay = document.getElementById("resetValueDisplay")
const resetPointsBtn = document.getElementById("resetPointsBtn")

const caseTypeModal = document.getElementById("caseTypeModal")
const caseTypeModalTitle = document.getElementById("caseTypeModalTitle")
const caseTypeModalClose = document.getElementById("caseTypeModalClose")
const caseTypeModalCancel = document.getElementById("caseTypeModalCancel")
const caseTypeModalSave = document.getElementById("caseTypeModalSave")
const caseTypeName = document.getElementById("caseTypeName")
const caseTypePoints = document.getElementById("caseTypePoints")
const caseTypeDescription = document.getElementById("caseTypeDescription")
const addCaseTypeBtn = document.getElementById("addCaseTypeBtn")
const caseTypesGrid = document.getElementById("caseTypesGrid")

// Global variables
const adminEmails = ["admin@example.com"]
let currentUser = null
let allCases = []
let allStudentsForManage = []
let allStudentsForWarning = []
let studentToDeleteId = null
let caseTypes = []
let editingCaseTypeId = null
let issuedWarningLetters = [] // Add tracking for issued warning letters

// Navigation functionality
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    const tabName = item.dataset.tab

    // Update active nav item
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"))
    item.classList.add("active")

    // Update active tab content
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
    document.getElementById(`${tabName}-tab`).classList.add("active")
  })
})

// Authentication state observer
onAuthStateChanged(auth, (user) => {
  if (user && adminEmails.includes(user.email)) {
    currentUser = user
    loginSection.style.display = "none"
    adminSection.style.display = "block"
    loadUsers()
    loadCases()
    loadCaseTypes()
    loadWarningLetterSettings()
    loadWarningLetterData()
    
            loadManageStudents()
            
    // Load issued warning letters on auth state change
  } else {
    currentUser = null
    loginSection.style.display = "block"
    adminSection.style.display = "none"
  }
})

// Login functionality
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  if (!email || !password) {
    showDialog("Harap isi email dan password!")
    return
  }

  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch (error) {
    showDialog("Login gagal: " + error.message)
  }
})

// Logout functionality
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth)
  } catch (error) {
    showDialog("Logout gagal: " + error.message)
  }
})

async function loadCaseTypes() {
  if (!currentUser) return

  onValue(
    ref(db, "caseTypes"),
    (snapshot) => {
      caseTypes = []

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const caseTypeData = childSnapshot.val()
          caseTypes.push({
            id: childSnapshot.key,
            ...caseTypeData,
          })
        })
      } else {
        // Initialize with default case types
        initializeDefaultCaseTypes()
      }

      displayCaseTypes()
      updateCaseReasonDropdown()
      updateCaseFilterDropdown()
    },
    (error) => {
      showDialog("Gagal memuat jenis kasus: " + error.message)
    },
  )
}

async function initializeDefaultCaseTypes() {
  const defaultCaseTypes = [
    { name: "Terlambat", points: 5, description: "Datang terlambat ke sekolah" },
    { name: "Tidak Mengerjakan PR", points: 10, description: "Tidak mengerjakan pekerjaan rumah" },
    { name: "Berkelahi", points: 25, description: "Berkelahi dengan siswa lain" },
    { name: "Tidak Memakai Seragam", points: 8, description: "Tidak memakai seragam lengkap" },
    { name: "Mencontek", points: 15, description: "Mencontek saat ujian atau ulangan" },
    { name: "Membolos", points: 20, description: "Tidak masuk sekolah tanpa keterangan" },
  ]

  for (const caseType of defaultCaseTypes) {
    const newCaseTypeRef = push(ref(db, "caseTypes"))
    await set(newCaseTypeRef, {
      ...caseType,
      createdBy: currentUser.email,
      createdAt: Date.now(),
    })
  }
}

function displayCaseTypes() {
  caseTypesGrid.innerHTML = ""

  if (caseTypes.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "empty-state"
    emptyState.innerHTML = `
      <div class="material-symbols-rounded">rule</div>
      <h3>Belum ada jenis kasus</h3>
      <p>Tambahkan jenis kasus untuk memulai</p>
    `
    caseTypesGrid.appendChild(emptyState)
    return
  }

  caseTypes.forEach((caseType) => {
    const caseTypeCard = document.createElement("div")
    caseTypeCard.className = "case-type-card"
    caseTypeCard.innerHTML = `
      <div class="case-type-header">
        <div>
          <div class="case-type-name">${caseType.name}</div>
          <div class="case-type-points">-${caseType.points} poin</div>
        </div>
      </div>
      ${caseType.description ? `<div class="case-type-description">${caseType.description}</div>` : ""}
      <div class="case-type-actions">
        <button class="btn-edit" onclick="editCaseType('${caseType.id}')">
          <span class="material-symbols-rounded">edit</span>
          Edit
        </button>
        <button class="btn-delete" onclick="deleteCaseType('${caseType.id}', '${caseType.name}')">
          <span class="material-symbols-rounded">delete</span>
          Hapus
        </button>
      </div>
    `
    caseTypesGrid.appendChild(caseTypeCard)
  })
}

function updateCaseReasonDropdown() {
  const currentValue = caseReason.value
  caseReason.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran --</option>'

  caseTypes.forEach((caseType) => {
    const option = document.createElement("option")
    option.value = caseType.name
    option.textContent = `${caseType.name} (-${caseType.points} poin)`
    option.dataset.points = caseType.points
    caseReason.appendChild(option)
  })

  // Add "Lainnya" option
  const otherOption = document.createElement("option")
  otherOption.value = "Lainnya"
  otherOption.textContent = "Lainnya"
  caseReason.appendChild(otherOption)

  // Restore previous value if it exists
  if (currentValue) {
    caseReason.value = currentValue
  }
}

function updateCaseFilterDropdown() {
  const currentValue = caseFilterType.value
  caseFilterType.innerHTML = '<option value="">Semua Jenis Pelanggaran</option>'

  caseTypes.forEach((caseType) => {
    const option = document.createElement("option")
    option.value = caseType.name
    option.textContent = caseType.name
    caseFilterType.appendChild(option)
  })

  // Add "Lainnya" option
  const otherOption = document.createElement("option")
  otherOption.value = "Lainnya"
  otherOption.textContent = "Lainnya"
  caseFilterType.appendChild(otherOption)

  // Restore previous value if it exists
  if (currentValue) {
    caseFilterType.value = currentValue
  }
}

// Case type modal functions
addCaseTypeBtn.addEventListener("click", () => {
  editingCaseTypeId = null
  caseTypeModalTitle.textContent = "Tambah Jenis Kasus"
  caseTypeName.value = ""
  caseTypePoints.value = ""
  caseTypeDescription.value = ""
  caseTypeModal.style.display = "flex"
})

window.editCaseType = (caseTypeId) => {
  const caseType = caseTypes.find((ct) => ct.id === caseTypeId)
  if (!caseType) return

  editingCaseTypeId = caseTypeId
  caseTypeModalTitle.textContent = "Edit Jenis Kasus"
  caseTypeName.value = caseType.name
  caseTypePoints.value = caseType.points
  caseTypeDescription.value = caseType.description || ""
  caseTypeModal.style.display = "flex"
}

window.deleteCaseType = async (caseTypeId, caseTypeName) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus jenis kasus "${caseTypeName}"?`)) {
    return
  }

  try {
    await remove(ref(db, `caseTypes/${caseTypeId}`))
    showDialog("Jenis kasus berhasil dihapus!")
  } catch (error) {
    showDialog("Gagal menghapus jenis kasus: " + error.message)
  }
}

caseTypeModalSave.addEventListener("click", async () => {
  const name = caseTypeName.value.trim()
  const points = Number.parseInt(caseTypePoints.value)
  const description = caseTypeDescription.value.trim()

  if (!name || !points || points < 1 || points > 100) {
    showDialog("Harap isi nama dan poin dengan benar (1-100)!")
    return
  }

  const caseTypeData = {
    name,
    points,
    description,
    updatedBy: currentUser.email,
    updatedAt: Date.now(),
  }

  try {
    if (editingCaseTypeId) {
      // Update existing case type
      await update(ref(db, `caseTypes/${editingCaseTypeId}`), caseTypeData)
      showDialog("Jenis kasus berhasil diperbarui!")
    } else {
      // Create new case type
      caseTypeData.createdBy = currentUser.email
      caseTypeData.createdAt = Date.now()
      const newCaseTypeRef = push(ref(db, "caseTypes"))
      await set(newCaseTypeRef, caseTypeData)
      showDialog("Jenis kasus berhasil ditambahkan!")
    }

    caseTypeModal.style.display = "none"
  } catch (error) {
    showDialog("Gagal menyimpan jenis kasus: " + error.message)
  }
})

// Case type modal close handlers
caseTypeModalClose.addEventListener("click", () => {
  caseTypeModal.style.display = "none"
})

caseTypeModalCancel.addEventListener("click", () => {
  caseTypeModal.style.display = "none"
})

// Case reason change handler with auto-fill points
caseReason.addEventListener("change", () => {
  if (caseReason.value === "Lainnya") {
    otherReasonContainer.style.display = "block"
    casePoints.value = ""
    casePoints.readOnly = false
  } else {
    otherReasonContainer.style.display = "none"
    const selectedOption = caseReason.selectedOptions[0]
    if (selectedOption && selectedOption.dataset.points) {
      casePoints.value = selectedOption.dataset.points
    }
    casePoints.readOnly = false
  }
  updateFinalPoints()
})

// Auto-calculate final points
casePoints.addEventListener("input", updateFinalPoints)

function updateFinalPoints() {
  const initial = Number.parseInt(initialPoints.value) || 0
  const deduction = Number.parseInt(casePoints.value) || 0
  const final = Math.max(0, initial - deduction)
  finalPoints.value = final
}

// Utility functions
function getProperUID(userData, fallbackKey = null) {
  return userData.uid || userData.id || userData.nisn || fallbackKey || "N/A"
}

function getProperName(userData) {
  return userData.name || userData.displayName || userData.username || "Nama Tidak Diketahui"
}

function getPointsStatus(points) {
  if (points >= 80) return "good"
  if (points >= 60) return "warning"
  if (points >= 30) return "danger"
  return "critical"
}

function getStatusText(points) {
  if (points >= 80) return "Baik"
  if (points >= 60) return "Perhatian"
  if (points >= 30) return "Bahaya"
  return "Kritis"
}

// Select student function
window.selectStudent = (uid, name, points) => {
  caseUID.value = uid
  studentName.value = name
  initialPoints.value = points
  finalPoints.value = points

  // Switch to add case tab
  document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"))
  document.querySelector('[data-tab="add-case"]').classList.add("active")
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"))
  document.getElementById("add-case-tab").classList.add("active")
}

// Clear case form
function clearCaseForm() {
  caseUID.value = ""
  studentName.value = ""
  initialPoints.value = ""
  caseReason.value = ""
  otherReason.value = ""
  caseDetails.value = ""
  casePoints.value = ""
  finalPoints.value = ""
  otherReasonContainer.style.display = "none"
}

// Add case functionality
addCaseBtn.addEventListener("click", handleAddCase)

function handleAddCase() {
  if (!currentUser || !adminEmails.includes(currentUser.email)) {
    showDialog("Hanya admin yang bisa menambahkan kasus!")
    return
  }

  const uid = caseUID.value.trim()
  const name = studentName.value.trim()
  const points = Number.parseInt(casePoints.value)
  let reason = caseReason.value

  if (reason === "Lainnya") {
    reason = otherReason.value.trim()
  }

  const details = caseDetails.value.trim()
  const newPoints = Number.parseInt(finalPoints.value)
  const timestamp = Date.now()
  const caseDate = new Date().toISOString().split("T")[0]

  if (!uid || !points || !reason || !name) {
    showDialog("Harap isi semua data dengan benar!")
    return
  }

  const namapemiliknomor = name.charAt(0).toUpperCase() + uid

  // Find or create student
  get(ref(db, "users"))
    .then((snapshot) => {
      let childKey = null
      let userData = null

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val()
          const displayUID = getProperUID(data, childSnapshot.key)
          if (displayUID === uid) {
            childKey = childSnapshot.key
            userData = data
          }
        })
      }

      if (!childKey) {
        childKey = uid
      }

      // Create case record
      const newCaseRef = push(ref(db, "cases"))
      const caseData = {
        uid: uid,
        name: name,
        namapemiliknomor: namapemiliknomor, // Added namapemiliknomor field
        caseType: reason,
        details: details,
        pointsDeducted: points,
        initialPoints: Number.parseInt(initialPoints.value) || 0,
        finalPoints: newPoints,
        timestamp: timestamp,
        date: caseDate,
        createdBy: currentUser.email,
        createdByUid: currentUser.uid,
      }

      set(newCaseRef, caseData)
        .then(() => {
          // Update user data
          const updatedUserData = {
            name: name,
            namapemiliknomor: namapemiliknomor, // Added namapemiliknomor to user data
            points: newPoints,
            poin: newPoints,
            uid: uid,
            lastCaseDate: caseDate,
            lastCaseType: reason,
            pointsDeducted: points,
            lastUpdated: timestamp,
            updatedBy: currentUser.email,
          }

          update(ref(db, `users/${childKey}`), updatedUserData)
            .then(() => {
              // Update user_logins if exists
              get(ref(db, "user_logins/" + childKey)).then((loginSnapshot) => {
                if (loginSnapshot.exists()) {
                  const loginUpdateData = {
                    namapemiliknomor: namapemiliknomor, // Added namapemiliknomor to login data
                    points: newPoints,
                    lastCaseDate: caseDate,
                    pointsDeducted: points,
                    lastUpdated: timestamp,
                  }
                  update(ref(db, "user_logins/" + childKey), loginUpdateData)
                }
              })

              showDialog("Kasus berhasil ditambahkan!")
              loadUsers()
              loadCases()
              loadManageStudents()
              loadWarningLetterData()
              clearCaseForm()
            })
            .catch((error) => {
              showDialog("Gagal mengupdate data user: " + error.message)
            })
        })
        .catch((error) => {
          showDialog("Gagal menambahkan kasus: " + error.message)
        })
    })
    .catch((error) => {
      showDialog("Gagal mengambil data user: " + error.message)
    })
}

// Load users function
function loadUsers() {
  if (!currentUser) return

  onValue(
    ref(db, "users"),
    (snapshot) => {
      usersTableBody.innerHTML = ""

      if (!snapshot.exists()) {
        const emptyRow = document.createElement("tr")
        emptyRow.innerHTML = `
          <td colspan="5" class="empty-state">
            <div class="material-symbols-rounded">people_outline</div>
            <h3>Belum ada data siswa</h3>
            <p>Data siswa akan muncul di sini setelah ditambahkan</p>
          </td>
        `
        usersTableBody.appendChild(emptyRow)
        return
      }

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val()
        const childKey = childSnapshot.key

        // Skip admin users
        if (userData.email && adminEmails.includes(userData.email)) {
          return
        }

        // Skip entries that don't look like student data
        if (!userData.name && !userData.uid && !userData.id) {
          return
        }

        const displayUID = getProperUID(userData, childKey)
        const displayName = getProperName(userData)
        const points =
          userData.points !== undefined ? userData.points : userData.poin !== undefined ? userData.poin : 100
        const status = getPointsStatus(points)
        const statusText = getStatusText(points)

        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${displayUID}</td>
          <td>${displayName}</td>
          <td><strong>${points}</strong></td>
          <td><span class="status-badge status-${status}">${statusText}</span></td>
          <td>
            <button class="btn-select" onclick="selectStudent('${displayUID}', '${displayName}', ${points})">
              <span class="material-symbols-rounded">check_circle</span>
              Pilih
            </button>
          </td>
        `

        usersTableBody.appendChild(row)
      })
    },
    (error) => {
      showDialog("Gagal memuat data siswa: " + error.message)
    },
  )
}

// Load cases function
function loadCases() {
  if (!currentUser) return

  onValue(
    ref(db, "cases"),
    (snapshot) => {
      allCases = []

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const caseData = childSnapshot.val()
          allCases.push({
            id: childSnapshot.key,
            ...caseData,
          })
        })
      }

      allCases.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      displayCases(allCases)
    },
    (error) => {
      showDialog("Gagal memuat data kasus: " + error.message)
    },
  )
}

// Display cases
function displayCases(casesArray) {
  caseList.innerHTML = ""

  if (casesArray.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "empty-state"
    emptyState.innerHTML = `
      <div class="material-symbols-rounded">history</div>
      <h3>Belum ada kasus yang tercatat</h3>
      <p>Riwayat kasus akan muncul di sini setelah ditambahkan</p>
    `
    caseList.appendChild(emptyState)
    return
  }

  casesArray.forEach((caseData) => {
    const caseItem = document.createElement("div")
    caseItem.className = "case-item"

    const finalPoints = caseData.finalPoints || 0
    const maxPoints = 100
    const progressPercentage = Math.min((finalPoints / maxPoints) * 100, 100)
    const progressStatus = getPointsStatus(finalPoints)

    const caseDate = caseData.date ? new Date(caseData.date).toLocaleDateString("id-ID") : "Tanggal tidak diketahui"

    caseItem.innerHTML = `
      <div class="case-header">
        <div class="case-student">
          <h3>${caseData.name || "Nama Tidak Diketahui"}</h3>
          <span class="uid">UID: ${caseData.uid || "N/A"}</span>
          ${caseData.namapemiliknomor ? `<span class="namapemiliknomor">Kode: ${caseData.namapemiliknomor}</span>` : ""}
        </div>
        <div class="case-date">${caseDate}</div>
      </div>
      <div class="case-info">
        <div class="info-item">
          <div class="info-label">Jenis Pelanggaran</div>
          <div class="info-value">${caseData.caseType || "Tidak Diketahui"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Poin Dikurangi</div>
          <div class="info-value">-${caseData.pointsDeducted || 0}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Poin Awal</div>
          <div class="info-value">${caseData.initialPoints || 0}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Poin Akhir</div>
          <div class="info-value">${finalPoints}</div>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-header">
          <span class="progress-label">Poin Siswa</span>
          <span class="progress-value">${finalPoints}/${maxPoints}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill progress-${progressStatus}" style="width: ${progressPercentage}%"></div>
        </div>
      </div>
      ${
        caseData.details
          ? `
        <div class="case-details">
          <p><strong>Detail:</strong> ${caseData.details}</p>
        </div>
      `
          : ""
      }
      <div class="case-creator">Dibuat oleh: ${caseData.createdBy || "Admin"}</div>
    `

    caseList.appendChild(caseItem)
  })
}

// Search and filter functionality
studentSearchInput.addEventListener("input", () => {
  const searchTerm = studentSearchInput.value.toLowerCase()
  const rows = usersTableBody.querySelectorAll("tr")

  rows.forEach((row) => {
    const name = row.cells[1]?.textContent.toLowerCase() || ""
    const uid = row.cells[0]?.textContent.toLowerCase() || ""

    if (name.includes(searchTerm) || uid.includes(searchTerm)) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
})

caseSearchInput.addEventListener("input", filterCases)
caseFilterType.addEventListener("change", filterCases)

function filterCases() {
  const searchTerm = caseSearchInput.value.toLowerCase()
  const filterType = caseFilterType.value

  let filteredCases = allCases

  if (searchTerm) {
    filteredCases = filteredCases.filter(
      (caseData) =>
        (caseData.name || "").toLowerCase().includes(searchTerm) ||
        (caseData.uid || "").toLowerCase().includes(searchTerm),
    )
  }

  if (filterType) {
    filteredCases = filteredCases.filter((caseData) => caseData.caseType === filterType)
  }

  displayCases(filteredCases)
}

// Load manage students
function loadManageStudents() {
  if (!currentUser) return

  onValue(
    ref(db, "users"),
    (snapshot) => {
      allStudentsForManage = []

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val()
          const childKey = childSnapshot.key

          if (userData.email && adminEmails.includes(userData.email)) {
            return
          }

          if (!userData.name && !userData.uid && !userData.id) {
            return
          }

          allStudentsForManage.push({
            id: childKey,
            ...userData,
          })
        })
      }

      displayManageStudents(allStudentsForManage)
    },
    (error) => {
      showDialog("Gagal memuat data siswa: " + error.message)
    },
  )
}

function displayManageStudents(studentsArray) {
  manageTableBody.innerHTML = ""

  if (studentsArray.length === 0) {
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = `
      <td colspan="6" class="empty-state">
        <div class="material-symbols-rounded">person_off</div>
        <h3>Tidak Ada Data Siswa</h3>
        <p>Belum ada siswa yang terdaftar dalam sistem</p>
      </td>
    `
    manageTableBody.appendChild(emptyRow)
    return
  }

  studentsArray.forEach((student) => {
    const displayUID = getProperUID(student, student.id)
    const displayName = getProperName(student)
    const points = student.points !== undefined ? student.points : student.poin !== undefined ? student.poin : 100

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>
        <div>
          <div class="font-medium">${displayName}</div>
          <div class="text-sm text-gray">NISN: ${displayUID}</div>
        </div>
      </td>
      <td><strong>${points}</strong></td>
      <td>${student.lastCaseType || "-"}</td>
      <td>${student.pointsDeducted || "-"}</td>
      <td class="text-sm text-gray">${student.updatedBy || "-"}</td>
      <td>
        <button class="btn-delete" onclick="confirmDeleteStudent('${student.id}', '${displayName}')">
          <span class="material-symbols-rounded">delete</span>
          Hapus
        </button>
      </td>
    `

    manageTableBody.appendChild(row)
  })
}

// Delete student functionality
window.confirmDeleteStudent = (studentId, studentName) => {
  studentToDeleteId = studentId
  studentToDelete.textContent = studentName
  deleteModalOverlay.style.display = "flex"
}

function hideDeleteModal() {
  deleteModalOverlay.style.display = "none"
  studentToDeleteId = null
}

deleteModalClose.addEventListener("click", hideDeleteModal)
deleteModalCancel.addEventListener("click", hideDeleteModal)

deleteModalConfirm.addEventListener("click", () => {
  if (studentToDeleteId) {
    // Delete from users
    remove(ref(db, `users/${studentToDeleteId}`))
      .then(() => {
        // Delete from user_logins if exists
        remove(ref(db, `user_logins/${studentToDeleteId}`))

        // Delete related cases
        get(ref(db, "cases")).then((snapshot) => {
          if (snapshot.exists()) {
            const promises = []
            snapshot.forEach((childSnapshot) => {
              const caseData = childSnapshot.val()
              if (caseData.uid === studentToDeleteId || caseData.createdByUid === studentToDeleteId) {
                promises.push(remove(ref(db, `cases/${childSnapshot.key}`)))
              }
            })
            Promise.all(promises)
          }
        })

        // Delete related warning letters
        get(ref(db, "warningLetters")).then((snapshot) => {
          if (snapshot.exists()) {
            const promises = []
            snapshot.forEach((childSnapshot) => {
              const warningData = childSnapshot.val()
              if (warningData.studentId === studentToDeleteId) {
                promises.push(remove(ref(db, `warningLetters/${childSnapshot.key}`)))
              }
            })
            Promise.all(promises)
          }
        })

        showDialog("Data siswa berhasil dihapus!")
        hideDeleteModal()
        loadManageStudents()
        loadUsers()
        loadCases()
        loadWarningLetterData()
      })
      .catch((error) => {
        showDialog("Gagal menghapus data siswa: " + error.message)
      })
  }
})

// Reset points functionality
resetPointsBtn.addEventListener("click", () => {
  resetModalOverlay.style.display = "flex"
})

function hideResetModal() {
  resetModalOverlay.style.display = "none"
}

resetModalClose.addEventListener("click", hideResetModal)
resetModalCancel.addEventListener("click", hideResetModal)

resetValue.addEventListener("input", () => {
  resetValueDisplay.textContent = resetValue.value
})

resetModalConfirm.addEventListener("click", () => {
  const resetVal = Number.parseInt(resetValue.value)

  if (isNaN(resetVal) || resetVal < 0 || resetVal > 100) {
    showDialog("Nilai reset harus antara 0-100!")
    return
  }

  get(ref(db, "users"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const promises = []
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val()

          if (userData.email && adminEmails.includes(userData.email)) {
            return
          }

          if (!userData.name && !userData.uid && !userData.id) {
            return
          }

          promises.push(
            update(ref(db, `users/${childSnapshot.key}`), {
              points: resetVal,
              poin: resetVal,
              lastUpdated: Date.now(),
              updatedBy: currentUser.email,
            }),
          )

          // Update user_logins if exists
          get(ref(db, `user_logins/${childSnapshot.key}`)).then((loginSnapshot) => {
            if (loginSnapshot.exists()) {
              update(ref(db, `user_logins/${childSnapshot.key}`), {
                points: resetVal,
                poin: resetVal,
                lastUpdated: Date.now(),
              })
            }
          })
        })

        Promise.all(promises)
          .then(() => {
            showDialog(`Semua poin siswa berhasil direset ke ${resetVal}!`)
            hideResetModal()
            loadUsers()
            loadManageStudents()
            loadWarningLetterData()
          })
          .catch((error) => {
            showDialog("Gagal mereset poin: " + error.message)
          })
      }
    })
    .catch((error) => {
      showDialog("Gagal mengambil data untuk reset: " + error.message)
    })
})

// Warning letter functionality
function loadWarningLetterData() {
  if (!currentUser) return

  // Load issued warning letters from Firebase
  onValue(ref(db, "warningLetters"), (snapshot) => {
    issuedWarningLetters = []
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const warningData = childSnapshot.val()
        issuedWarningLetters.push({
          id: childSnapshot.key,
          ...warningData,
        })
      })
    }
  })

  onValue(
    ref(db, "users"),
    (snapshot) => {
      allStudentsForWarning = []

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val()
          const childKey = childSnapshot.key

          if (userData.email && adminEmails.includes(userData.email)) {
            return
          }

          if (!userData.name && !userData.uid && !userData.id) {
            return
          }

          const points =
            userData.points !== undefined ? userData.points : userData.poin !== undefined ? userData.poin : 100
          const violationPoints = 100 - points

          if (violationPoints > 30 || hasIssuedWarningLetter(childKey)) {
            allStudentsForWarning.push({
              id: childKey,
              ...userData,
              violationPoints,
            })
          }
        })
      }

      displayWarningStudents(allStudentsForWarning)
    },
    (error) => {
      showDialog("Gagal memuat data siswa: " + error.message)
    },
  )
}

function hasIssuedWarningLetter(studentId) {
  return issuedWarningLetters.some((warning) => warning.studentId === studentId)
}

function getLatestWarningLetter(studentId) {
  const studentWarnings = issuedWarningLetters.filter((warning) => warning.studentId === studentId)
  if (studentWarnings.length === 0) return null

  return studentWarnings.sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate))[0]
}

function displayWarningStudents(studentsArray) {
  warningTableBody.innerHTML = ""

  if (studentsArray.length === 0) {
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = `
      <td colspan="7" class="empty-state">
        <div class="material-symbols-rounded">check_circle</div>
        <h3>Tidak Ada Siswa yang Memerlukan SP</h3>
        <p>Semua siswa memiliki poin pelanggaran di bawah 30</p>
      </td>
    `
    warningTableBody.appendChild(emptyRow)
    return
  }

  studentsArray.forEach((student) => {
    const displayUID = getProperUID(student, student.id)
    const displayName = getProperName(student)
    const points = student.points !== undefined ? student.points : student.poin !== undefined ? student.poin : 100
    const violationPoints = student.violationPoints

    let spType = ""
    if (violationPoints >= 90) spType = "SP 3"
    else if (violationPoints >= 60) spType = "SP 2"
    else if (violationPoints >= 30) spType = "SP 1"

    const latestWarning = getLatestWarningLetter(student.id)
    const hasIssued = latestWarning !== null
    const issuedDate = hasIssued ? new Date(latestWarning.issuedDate).toLocaleDateString("id-ID") : ""

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${displayName}</td>
      <td>${displayUID}</td>
      <td><strong>${points}</strong></td>
      <td><strong class="text-red">${violationPoints}</strong></td>
      <td><span class="status-badge ${hasIssued ? "status-success" : "status-danger"}">${hasIssued ? latestWarning.spType : spType}</span></td>
      
      <td>
        <button class="btn-primary" onclick="generateWarningLetter(${JSON.stringify(student).replace(/"/g, "&quot;")})">
          <span class="material-symbols-rounded">${hasIssued ? "refresh" : "download"}</span>
          ${hasIssued ? "Terbitkan Ulang" : "SP"}
        </button>
      </td>
    `

    warningTableBody.appendChild(row)
  })
}

// Warning search functionality
warningSearchInput.addEventListener("input", () => {
  const searchTerm = warningSearchInput.value.toLowerCase()

  if (searchTerm) {
    const filteredStudents = allStudentsForWarning.filter(
      (student) =>
        getProperName(student).toLowerCase().includes(searchTerm) ||
        getProperUID(student, student.id).toLowerCase().includes(searchTerm),
    )
    displayWarningStudents(filteredStudents)
  } else {
    displayWarningStudents(allStudentsForWarning)
  }
})

// Manage search functionality
manageSearchInput.addEventListener("input", () => {
  const searchTerm = manageSearchInput.value.toLowerCase()

  if (searchTerm) {
    const filteredStudents = allStudentsForManage.filter(
      (student) =>
        getProperName(student).toLowerCase().includes(searchTerm) ||
        getProperUID(student, student.id).toLowerCase().includes(searchTerm),
    )
    displayManageStudents(filteredStudents)
  } else {
    displayManageStudents(allStudentsForManage)
  }
})

// Generate warning letter
window.generateWarningLetter = async (studentData) => {
  const canvas = document.getElementById("warningLetterCanvas")
  const ctx = canvas.getContext("2d")

  // Get custom values from form
  const schoolName = document.getElementById("schoolName").value || "SEKOLAH MENENGAH ATAS NEGERI 1"
  const schoolAddress = document.getElementById("schoolAddress").value || "Jl. Pendidikan No. 123, Kota Pendidikan"
  const principalName = document.getElementById("principalName").value || "Drs. H. Ahmad Suryadi, M.Pd"
  const principalNIP = document.getElementById("principalNIP").value || "196501011990031003"
  const meetingDate = document.getElementById("meetingDate").value
  const meetingTime = document.getElementById("meetingTime").value || "08:00"

  // Clear canvas
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "black"
  ctx.textAlign = "center"

  let yPosition = 50

  // Header
  ctx.font = "bold 24px Arial"
  ctx.fillText(schoolName, canvas.width / 2, yPosition)
  yPosition += 30

  ctx.font = "16px Arial"
  ctx.fillText(schoolAddress, canvas.width / 2, yPosition)
  yPosition += 40

  // Line separator
  ctx.beginPath()
  ctx.moveTo(50, yPosition)
  ctx.lineTo(canvas.width - 50, yPosition)
  ctx.strokeStyle = "black"
  ctx.lineWidth = 2
  ctx.stroke()
  yPosition += 40

  // Letter title
  const violationPoints = 100 - (studentData.points || 0)
  let spType = ""
  if (violationPoints >= 90) spType = "SP 3"
  else if (violationPoints >= 60) spType = "SP 2"
  else if (violationPoints >= 30) spType = "SP 1"

  ctx.font = "bold 20px Arial"
  ctx.fillText(`SURAT PANGGILAN ${spType}`, canvas.width / 2, yPosition)
  yPosition += 40

  // Date
  const today = new Date()
  const dateStr = today.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  ctx.textAlign = "right"
  ctx.font = "14px Arial"
  ctx.fillText(`${schoolAddress.split(",")[1] || "Kota"}, ${dateStr}`, canvas.width - 50, yPosition)
  yPosition += 40

  // Letter content
  ctx.textAlign = "left"
  ctx.font = "14px Arial"
  ctx.fillText("Kepada Yth.", 50, yPosition)
  yPosition += 20
  ctx.fillText("Orang Tua/Wali Siswa", 50, yPosition)
  yPosition += 20
  ctx.fillText(`a.n. ${studentData.name || "Nama Siswa"}`, 50, yPosition)
  yPosition += 20
  ctx.fillText("di Tempat", 50, yPosition)
  yPosition += 40

  const content = [
    "Dengan ini kami sampaikan bahwa putra/putri Bapak/Ibu:",
    "",
    `Nama: ${studentData.name || "Nama Siswa"}`,
    `UID: ${getProperUID(studentData)}`,
    `Poin Pelanggaran: ${violationPoints} poin`,
    "",
    `Telah melakukan pelanggaran tata tertib sekolah sehingga mendapat ${spType}.`,
    "Sehubungan dengan hal tersebut, kami mengundang Bapak/Ibu untuk hadir",
    "ke sekolah guna membahas perkembangan putra/putri Bapak/Ibu.",
  ]

  content.forEach((line) => {
    ctx.fillText(line, 50, yPosition)
    yPosition += 20
  })

  // Meeting info if date is provided
  if (meetingDate) {
    yPosition += 20
    const meetingDateFormatted = new Date(meetingDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    ctx.fillText(`Hari/Tanggal: ${meetingDateFormatted}`, 50, yPosition)
    yPosition += 20
    ctx.fillText(`Waktu: ${meetingTime} WIB`, 50, yPosition)
    yPosition += 20
    ctx.fillText("Tempat: Ruang Kepala Sekolah", 50, yPosition)
    yPosition += 30
  }

  yPosition += 20
  ctx.fillText("Demikian surat panggilan ini kami sampaikan. Atas perhatian dan", 50, yPosition)
  yPosition += 20
  ctx.fillText("kerjasamanya, kami ucapkan terima kasih.", 50, yPosition)
  yPosition += 60

  // Signature
  ctx.textAlign = "right"
  ctx.fillText("Kepala Sekolah,", canvas.width - 50, yPosition)
  yPosition += 80
  ctx.fillText(studentData.principalName || principalName, canvas.width - 50, yPosition)
  yPosition += 20
  ctx.fillText(`NIP. ${studentData.principalNIP || principalNIP}`, canvas.width - 50, yPosition)

  try {
    const warningLetterData = {
      studentId: studentData.id,
      studentName: studentData.name,
      studentUID: getProperUID(studentData),
      spType: spType,
      violationPoints: violationPoints,
      currentPoints: studentData.points || 0,
      issuedDate: new Date().toISOString(),
      issuedBy: currentUser.email,
      schoolName: schoolName,
      principalName: principalName,
      meetingDate: meetingDate,
      meetingTime: meetingTime,
    }

    await push(ref(db, "warningLetters"), warningLetterData)
  } catch (error) {
    console.error("Error saving warning letter:", error)
  }

  // Download the image
  const link = document.createElement("a")
  link.download = `Surat_Panggilan_${spType}_${studentData.name || "Siswa"}.png`
  link.href = canvas.toDataURL()
  link.click()

  showDialog(`Surat panggilan ${spType} untuk ${studentData.name} berhasil diunduh!`)
}

// Modal functions
function showDialog(message) {
  dialogMessage.textContent = message
  dialogOverlay.style.display = "flex"
}

function hideDialog() {
  dialogOverlay.style.display = "none"
}

modalClose.addEventListener("click", hideDialog)
modalOk.addEventListener("click", hideDialog)

// Modal event listeners
deleteModalOverlay.addEventListener("click", (e) => {
  if (e.target === deleteModalOverlay) {
    hideDeleteModal()
  }
})

resetModalOverlay.addEventListener("click", (e) => {
  if (e.target === resetModalOverlay) {
    hideResetModal()
  }
})

caseTypeModal.addEventListener("click", (e) => {
  if (e.target === caseTypeModal) {
    caseTypeModal.style.display = "none"
  }
})

dialogOverlay.addEventListener("click", (e) => {
  if (e.target === dialogOverlay) {
    hideDialog()
  }
})

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideDeleteModal()
    hideResetModal()
    hideDialog()
    caseTypeModal.style.display = "none"
  }
})

function saveWarningLetterSettings() {
  const settings = {
    schoolName: document.getElementById("schoolName").value,
    schoolAddress: document.getElementById("schoolAddress").value,
    principalName: document.getElementById("principalName").value,
    principalNIP: document.getElementById("principalNIP").value,
    meetingDate: document.getElementById("meetingDate").value,
    meetingTime: document.getElementById("meetingTime").value,
  }
  localStorage.setItem("warningLetterSettings", JSON.stringify(settings))
}

function loadWarningLetterSettings() {
  const savedSettings = localStorage.getItem("warningLetterSettings")
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    document.getElementById("schoolName").value = settings.schoolName || "SEKOLAH MENENGAH ATAS NEGERI 1"
    document.getElementById("schoolAddress").value = settings.schoolAddress || "Jl. Pendidikan No. 123, Kota Pendidikan"
    document.getElementById("principalName").value = settings.principalName || "Drs. H. Ahmad Suryadi, M.Pd"
    document.getElementById("principalNIP").value = settings.principalNIP || "196501011990031003"
    document.getElementById("meetingDate").value = settings.meetingDate || ""
    document.getElementById("meetingTime").value = settings.meetingTime || "08:00"
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners for warning letter settings
  const settingsFields = ["schoolName", "schoolAddress", "principalName", "principalNIP", "meetingDate", "meetingTime"]

  settingsFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (field) {
      field.addEventListener("input", saveWarningLetterSettings)
      field.addEventListener("change", saveWarningLetterSettings)
    }
  })

  // Load settings on page load
  loadWarningLetterSettings()
})
