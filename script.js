import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyDX882cvhwQgfhbsLFn69Q2l-TUQUR5IBk",
  authDomain: "codingkan-factory-apps.firebaseapp.com",
  databaseURL: "https://codingkan-factory-apps-default-rtdb.firebaseio.com",
  projectId: "codingkan-factory-apps",
  storageBucket: "codingkan-factory-apps.firebasestorage.app",
  messagingSenderId: "188856222342",
  appId: "1:188856222342:android:ae0e1873684da414cec707",
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// DOM Elements
const loginSection = document.getElementById("loginSection")
const adminSection = document.getElementById("adminSection")
const usersTableBody = document.getElementById("usersTableBody")
const caseUID = document.getElementById("caseUID")
const studentName = document.getElementById("studentName")
const initialPoints = document.getElementById("initialPoints")
const caseReason = document.getElementById("caseReason")
const otherReasonContainer = document.getElementById("otherReasonContainer")
const otherReason = document.getElementById("otherReason")
const caseDetails = document.getElementById("caseDetails")
const casePoints = document.getElementById("casePoints")
const finalPoints = document.getElementById("finalPoints")
const caseList = document.getElementById("caseList")
const caseSearchInput = document.getElementById("caseSearchInput")
const caseFilterType = document.getElementById("caseFilterType")
const loginBtn = document.getElementById("loginBtn")
const logoutBtn = document.getElementById("logoutBtn")
const addCaseBtn = document.getElementById("addCaseBtn")
const dialogOverlay = document.getElementById("dialogOverlay")
const dialogMessage = document.getElementById("dialogMessage")
const modalClose = document.getElementById("modalClose")
const modalOk = document.getElementById("modalOk")
const studentSearchInput = document.getElementById("studentSearchInput")

// Navigation
const navItems = document.querySelectorAll(".nav-item")
const tabContents = document.querySelectorAll(".tab-content")

// Store admin user IDs
const adminEmails = ["admin@example.com"]

// Global variable to store current user
let currentUser = null
let allCases = []

// Navigation functionality
navItems.forEach((navItem) => {
  navItem.addEventListener("click", () => {
    const targetTab = navItem.dataset.tab

    // Remove active class from all nav items and tab contents
    navItems.forEach((item) => item.classList.remove("active"))
    tabContents.forEach((content) => content.classList.remove("active"))

    // Add active class to clicked nav item and corresponding tab content
    navItem.classList.add("active")
    document.getElementById(`${targetTab}-tab`).classList.add("active")
  })
})

// Auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user
  if (user) {
    const userEmail = user.email
    if (adminEmails.includes(userEmail)) {
      showAdminPanel()
    } else {
      showDialog("Akses tidak diizinkan. Anda bukan admin.")
      signOut(auth)
    }
  } else {
    currentUser = null
    showLoginPanel()
  }
})

// Event listeners
loginBtn.addEventListener("click", handleLogin)
logoutBtn.addEventListener("click", handleLogout)
caseReason.addEventListener("change", handleReasonChange)
casePoints.addEventListener("input", calculateFinalPoints)
addCaseBtn.addEventListener("click", handleAddCase)
caseSearchInput.addEventListener("input", filterCases)
caseFilterType.addEventListener("change", filterCases)
studentSearchInput.addEventListener("input", filterStudents)
modalClose.addEventListener("click", hideDialog)
modalOk.addEventListener("click", hideDialog)

// Handle login
function handleLogin() {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  if (adminEmails.includes(email)) {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        showAdminPanel()
      })
      .catch((error) => showDialog("Login gagal: " + error.message))
  } else {
    showDialog("Email ini tidak terdaftar sebagai admin!")
  }
}

// Handle logout
function handleLogout() {
  signOut(auth).then(() => showLoginPanel())
}

// Handle reason change
function handleReasonChange() {
  if (caseReason.value === "Lainnya") {
    otherReasonContainer.style.display = "block"
  } else {
    otherReasonContainer.style.display = "none"
  }
}

// Calculate final points
function calculateFinalPoints() {
  const initial = Number.parseInt(initialPoints.value) || 0
  const deduction = Number.parseInt(casePoints.value) || 0
  finalPoints.value = initial - deduction < 0 ? 0 : initial - deduction
}

// Handle add case
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

  // Find student based on uid
  get(ref(db, "users"))
    .then((snapshot) => {
      let childKey = null
      let userData = null

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val()
        const displayUID = getProperUID(data, childSnapshot.key)
        if (displayUID === uid) {
          childKey = childSnapshot.key
          userData = data
        }
      })

      if (!childKey) {
        childKey = uid
      }

      // Create new case in cases collection
      const newCaseRef = push(ref(db, "cases"))
      const caseData = {
        uid: uid,
        name: name,
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
          // Update user data with new points
          const updatedUserData = {
            name: name,
            points: newPoints,
            uid: uid,
            lastCaseDate: caseDate,
            lastCaseType: reason,
            pointsDeducted: points,
            lastUpdated: timestamp,
            updatedBy: currentUser.email,
          }

          // Update users node
          update(ref(db, `users/${childKey}`), updatedUserData)
            .then(() => {
              // Update user_logins if exists
              get(ref(db, "user_logins/" + childKey)).then((loginSnapshot) => {
                if (loginSnapshot.exists()) {
                  const loginUpdateData = {
                    points: newPoints,
                    lastCaseDate: caseDate,
                    pointsDeducted: points,
                    lastUpdated: timestamp,
                  }
                  update(ref(db, "user_logins/" + childKey), loginUpdateData)
                }
              })

              showDialog("Kasus berhasil ditambahkan!")

              // Refresh data
              loadUsers()
              loadCases()

              // Clear form
              clearCaseForm()
            })
            .catch((error) => {
              console.error("Error updating user:", error)
              showDialog("Gagal mengupdate data user: " + error.message)
            })
        })
        .catch((error) => {
          console.error("Error adding case:", error)
          showDialog("Gagal menambahkan kasus: " + error.message)
        })
    })
    .catch((error) => {
      console.error("Error fetching users:", error)
      showDialog("Gagal mengambil data user: " + error.message)
    })
}

// Helper functions
function getProperUID(userData, childKey) {
  if (userData.uid && !userData.uid.includes("@")) {
    return userData.uid
  } else if (userData.id && !userData.id.includes("@")) {
    return userData.id
  } else if (!childKey.includes("@")) {
    return childKey
  } else {
    return userData.name && !userData.name.includes("@")
      ? userData.name.replace(/\s+/g, "").toLowerCase() + Date.now().toString().slice(-4)
      : "USER" + Date.now().toString().slice(-6)
  }
}

function getProperName(userData) {
  if (userData.name && !userData.name.includes("@")) {
    return userData.name
  } else if (userData.fullName && !userData.fullName.includes("@")) {
    return userData.fullName
  } else if (userData.studentName && !userData.studentName.includes("@")) {
    return userData.studentName
  } else {
    return "Nama Tidak Tersedia"
  }
}

function getPointsStatus(points) {
  if (points >= 80) return "excellent"
  if (points >= 60) return "good"
  if (points >= 40) return "warning"
  return "danger"
}

function getStatusText(points) {
  if (points >= 80) return "Sangat Baik"
  if (points >= 60) return "Baik"
  if (points >= 40) return "Perlu Perhatian"
  return "Kritis"
}

// UI functions
function showAdminPanel() {
  loginSection.style.display = "none"
  adminSection.style.display = "block"
  loadUsers()
  loadCases()
}

function showLoginPanel() {
  loginSection.style.display = "block"
  adminSection.style.display = "none"
}

function showDialog(message) {
  dialogMessage.textContent = message
  dialogOverlay.classList.add("show")
}

function hideDialog() {
  dialogOverlay.classList.remove("show")
}

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

// Load users
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
                    <div class="material-icons-round">people_outline</div>
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
        const points = userData.points || userData.poin || 0
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
                        <span class="material-icons-round">check_circle</span>
                        Pilih
                    </button>
                </td>
            `

        usersTableBody.appendChild(row)
      })
    },
    (error) => {
      console.error("Error loading users:", error)
      showDialog("Gagal memuat data siswa: " + error.message)
    },
  )
}

// Global function to select student
window.selectStudent = (uid, name, points) => {
  caseUID.value = uid
  studentName.value = name
  initialPoints.value = points

  // Switch to add case tab
  navItems.forEach((item) => item.classList.remove("active"))
  tabContents.forEach((content) => content.classList.remove("active"))
  document.querySelector('[data-tab="add-case"]').classList.add("active")
  document.getElementById("add-case-tab").classList.add("active")
}

// Load cases
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

      // Sort by timestamp (newest first)
      allCases.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

      // Initial display
      displayCases(allCases)
    },
    (error) => {
      console.error("Error loading cases:", error)
      showDialog("Gagal memuat data kasus: " + error.message)
    },
  )
}

// Display cases with progress bars
function displayCases(casesArray) {
  caseList.innerHTML = ""

  if (casesArray.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "empty-state"
    emptyState.innerHTML = `
            <div class="material-icons-round">history</div>
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
    const maxPoints = 100 // Assuming max points is 100
    const progressPercentage = Math.min((finalPoints / maxPoints) * 100, 100)
    const progressStatus = getPointsStatus(finalPoints)

    caseItem.innerHTML = `
            <div class="case-header">
                <div class="case-student">
                    <h3>${caseData.name || "Siswa"}</h3>
                    <div class="uid">UID: ${caseData.uid || "N/A"}</div>
                </div>
                <div class="case-date">${caseData.date || "Tanggal tidak tersedia"}</div>
            </div>
            
            <div class="case-info">
                <div class="info-item">
                    <div class="info-label">Jenis Pelanggaran</div>
                    <div class="info-value">
                        <span class="case-type">${caseData.caseType || "N/A"}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pengurangan Poin</div>
                    <div class="info-value">-${caseData.pointsDeducted || 0} poin</div>
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
                    <div class="progress-label">Status Poin Siswa</div>
                    <div class="progress-value">${finalPoints}/${maxPoints} (${getStatusText(finalPoints)})</div>
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
            
            ${
              caseData.createdBy
                ? `
                <div class="case-creator">Dibuat oleh: ${caseData.createdBy}</div>
            `
                : ""
            }
        `

    caseList.appendChild(caseItem)
  })
}

// Filter cases
function filterCases() {
  if (!currentUser) return

  const searchText = caseSearchInput.value.toLowerCase().trim()
  const filterType = caseFilterType.value

  const filteredCases = allCases.filter((caseData) => {
    const matchesSearch =
      searchText === "" ||
      (caseData.name && caseData.name.toLowerCase().includes(searchText) && !caseData.name.includes("@")) ||
      (caseData.uid && caseData.uid.toLowerCase().includes(searchText) && !caseData.uid.includes("@"))

    const matchesType = filterType === "" || caseData.caseType === filterType

    return matchesSearch && matchesType
  })

  displayCases(filteredCases)
}

// Filter students
function filterStudents() {
  const searchText = studentSearchInput.value.toLowerCase().trim()
  const rows = usersTableBody.getElementsByTagName("tr")

  for (let i = 0; i < rows.length; i++) {
    const nameCell = rows[i].getElementsByTagName("td")[1]
    const uidCell = rows[i].getElementsByTagName("td")[0]

    if (nameCell && uidCell) {
      const name = (nameCell.textContent || nameCell.innerText || "").toLowerCase()
      const uid = (uidCell.textContent || uidCell.innerText || "").toLowerCase()

      const matchesSearch =
        searchText === "" ||
        (name.includes(searchText) && !name.includes("@")) ||
        (uid.includes(searchText) && !uid.includes("@"))

      rows[i].style.display = matchesSearch ? "" : "none"
    }
  }
}
