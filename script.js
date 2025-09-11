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
const resetPointsBtn = document.getElementById("resetPointsBtn")
const deleteModalOverlay = document.getElementById("deleteModalOverlay")
const resetModalOverlay = document.getElementById("resetModalOverlay")
const studentToDeleteElement = document.getElementById("studentToDelete")
const resetValueInput = document.getElementById("resetValue")
const resetValueDisplay = document.getElementById("resetValueDisplay")
const deleteModalClose = document.getElementById("deleteModalClose")
const deleteModalCancel = document.getElementById("deleteModalCancel")
const deleteModalConfirm = document.getElementById("deleteModalConfirm")
const resetModalClose = document.getElementById("resetModalClose")
const resetModalCancel = document.getElementById("resetModalCancel")
const resetModalConfirm = document.getElementById("resetModalConfirm")
const warningSearchInput = document.getElementById("warningSearchInput")
const warningTableBody = document.getElementById("warningTableBody")
const warningLetterCanvas = document.getElementById("warningLetterCanvas")
const studentSearchInput = document.getElementById("studentSearchInput")
const manageSearchInput = document.getElementById("manageSearchInput")
const manageTableBody = document.getElementById("manageTableBody")

// Navigation elements
const navItems = document.querySelectorAll(".nav-item")
const tabContents = document.querySelectorAll(".tab-content")

// Global variables
const adminEmails = ["admin@example.com"]
let currentUser = null
let allCases = []
let allStudentsForManage = []
let allStudentsForWarning = []
let studentToDeleteId = null

// Navigation functionality
navItems.forEach((navItem) => {
  navItem.addEventListener("click", () => {
    const targetTab = navItem.dataset.tab

    navItems.forEach((item) => item.classList.remove("active"))
    tabContents.forEach((content) => content.classList.remove("active"))

    navItem.classList.add("active")
    document.getElementById(targetTab + "-tab").classList.add("active")

    // Load data when switching to specific tabs
    if (targetTab === "manage") {
      loadManageStudents()
    } else if (targetTab === "warning-letter") {
      loadWarningLetterData()
    }
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

// Utility functions
function getProperUID(userData, fallbackKey = null) {
  return userData.uid || userData.id || userData.nisn || fallbackKey || "N/A"
}

function getProperName(userData) {
  return userData.name || userData.nama || "Nama tidak tersedia"
}

function getPointsStatus(points) {
  if (points >= 80) return "good"
  if (points >= 60) return "warning"
  if (points >= 40) return "danger"
  return "critical"
}

function getStatusText(points) {
  if (points === 0) return "Poin telah habis"
  if (points >= 80) return "Baik"
  if (points >= 60) return "Peringatan"
  if (points >= 40) return "Bahaya"
  return "Kritis"
}

// Dialog functions
function showDialog(message) {
  dialogMessage.textContent = message
  dialogOverlay.style.display = "flex"
}

function hideDialog() {
  dialogOverlay.style.display = "none"
}

// Modal event listeners
modalClose.addEventListener("click", hideDialog)
modalOk.addEventListener("click", hideDialog)
dialogOverlay.addEventListener("click", (e) => {
  if (e.target === dialogOverlay) hideDialog()
})

// Case reason change handler
caseReason.addEventListener("change", () => {
  if (caseReason.value === "Lainnya") {
    otherReasonContainer.style.display = "block"
  } else {
    otherReasonContainer.style.display = "none"
    otherReason.value = ""
  }
})

// Points calculation
casePoints.addEventListener("input", calculateFinalPoints)
initialPoints.addEventListener("input", calculateFinalPoints)

function calculateFinalPoints() {
  const initial = Number.parseInt(initialPoints.value) || 0
  const deduction = Number.parseInt(casePoints.value) || 0
  const final = Math.max(0, initial - deduction)
  finalPoints.value = final
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
              <span class="material-icons-round">check_circle</span>
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
    const maxPoints = 100
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
caseSearchInput.addEventListener("input", filterCases)
caseFilterType.addEventListener("change", filterCases)

function filterCases() {
  const searchText = caseSearchInput.value.toLowerCase().trim()
  const filterType = caseFilterType.value

  let filteredCases = allCases

  if (searchText !== "") {
    filteredCases = filteredCases.filter((caseData) => {
      const name = (caseData.name || "").toLowerCase()
      const uid = (caseData.uid || "").toLowerCase()
      const caseType = (caseData.caseType || "").toLowerCase()

      return name.includes(searchText) || uid.includes(searchText) || caseType.includes(searchText)
    })
  }

  if (filterType !== "all") {
    filteredCases = filteredCases.filter((caseData) => {
      return caseData.caseType === filterType
    })
  }

  displayCases(filteredCases)
}

// Student search functionality
studentSearchInput.addEventListener("input", filterStudents)

function filterStudents() {
  const searchText = studentSearchInput.value.toLowerCase().trim()
  const rows = usersTableBody.querySelectorAll("tr")

  rows.forEach((row) => {
    if (row.querySelector(".empty-state")) return

    const uid = row.cells[0].textContent.toLowerCase()
    const name = row.cells[1].textContent.toLowerCase()

    if (uid.includes(searchText) || name.includes(searchText)) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
}

// Manage students functionality
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
        <div class="material-icons-round">person_off</div>
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
    const status = getPointsStatus(points)

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>
        <div>
          <div class="font-medium">${displayName}</div>
          <div class="text-sm text-gray">NISN: ${displayUID}</div>
        </div>
      </td>
      <td>
        <span class="status-badge status-${status}">${points}</span>
      </td>
      <td>
        <div>
          <div class="font-medium">${student.lastCaseType || "Tidak ada kasus"}</div>
          <div class="text-sm text-gray">${student.lastCaseDate || ""}</div>
        </div>
      </td>
      <td>${student.pointsDeducted || 0}</td>
      <td class="text-sm text-gray">${student.updatedBy || "Sistem"}</td>
      <td>
        <button class="btn-delete" onclick="showDeleteModal('${student.id}', '${displayName.replace(/'/g, "\\'")}')">
          <span class="material-icons-round">delete</span>
          Hapus
        </button>
      </td>
    `
    manageTableBody.appendChild(row)
  })
}

manageSearchInput.addEventListener("input", filterManageStudents)

function filterManageStudents() {
  const searchText = manageSearchInput.value.toLowerCase().trim()

  if (searchText === "") {
    displayManageStudents(allStudentsForManage)
  } else {
    const filteredStudents = allStudentsForManage.filter((student) => {
      const displayName = getProperName(student).toLowerCase()
      const displayUID = getProperUID(student, student.id).toLowerCase()

      return displayName.includes(searchText) || displayUID.includes(searchText)
    })
    displayManageStudents(filteredStudents)
  }
}

// Delete modal functions
window.showDeleteModal = (studentId, studentName) => {
  studentToDeleteId = studentId
  studentToDeleteElement.textContent = studentName
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

resetValueInput.addEventListener("input", () => {
  resetValueDisplay.textContent = resetValueInput.value
})

resetModalConfirm.addEventListener("click", () => {
  const resetValue = Number.parseInt(resetValueInput.value)

  if (isNaN(resetValue) || resetValue < 0 || resetValue > 100) {
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
              points: resetValue,
              poin: resetValue,
              lastUpdated: Date.now(),
              updatedBy: currentUser.email,
            }),
          )

          // Update user_logins if exists
          get(ref(db, `user_logins/${childSnapshot.key}`)).then((loginSnapshot) => {
            if (loginSnapshot.exists()) {
              update(ref(db, `user_logins/${childSnapshot.key}`), {
                points: resetValue,
                poin: resetValue,
                lastUpdated: Date.now(),
              })
            }
          })
        })

        Promise.all(promises)
          .then(() => {
            showDialog(`Semua poin siswa berhasil direset ke ${resetValue}!`)
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

          const currentPoints =
            userData.points !== undefined ? userData.points : userData.poin !== undefined ? userData.poin : 100
          const violationPoints = 100 - currentPoints

          if (violationPoints >= 30 || currentPoints === 0) {
            allStudentsForWarning.push({
              id: childKey,
              violationPoints: violationPoints,
              ...userData,
            })
          }
        })
      }

      displayWarningStudents(allStudentsForWarning)
    },
    (error) => {
      showDialog("Gagal memuat data surat panggilan: " + error.message)
    },
  )
}

function displayWarningStudents(studentsArray) {
  warningTableBody.innerHTML = ""

  if (studentsArray.length === 0) {
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = `
      <td colspan="6" class="empty-state">
        <div class="material-icons-round">check_circle</div>
        <h3>Tidak Ada Siswa yang Memerlukan Surat Panggilan</h3>
        <p>Semua siswa memiliki poin pelanggaran di bawah 30</p>
      </td>
    `
    warningTableBody.appendChild(emptyRow)
    return
  }

  studentsArray.forEach((student) => {
    const displayUID = getProperUID(student, student.id)
    const displayName = getProperName(student)
    const currentPoints =
      student.points !== undefined ? student.points : student.poin !== undefined ? student.poin : 100
    const violationPoints = student.violationPoints

    let spType = ""
    let spClass = ""

    if (violationPoints >= 90) {
      spType = "SP 3"
      spClass = "status-danger"
    } else if (violationPoints >= 60) {
      spType = "SP 2"
      spClass = "status-warning"
    } else if (violationPoints >= 30) {
      spType = "SP 1"
      spClass = "status-good"
    }

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>
        <div class="font-medium">${displayName}</div>
      </td>
      <td>${displayUID}</td>
      <td>
        <span class="status-badge status-${getPointsStatus(currentPoints)}">${currentPoints}</span>
      </td>
      <td>
        <span class="font-medium text-red">${violationPoints}</span>
      </td>
      <td>
        <span class="status-badge ${spClass}">${spType}</span>
      </td>
      <td>
        <button class="btn-primary" onclick="generateWarningLetter(${JSON.stringify(student).replace(/"/g, "&quot;")})">
          <span class="material-icons-round">download</span>
          Download
        </button>
      </td>
    `
    warningTableBody.appendChild(row)
  })
}

warningSearchInput.addEventListener("input", filterWarningStudents)

function filterWarningStudents() {
  const searchText = warningSearchInput.value.toLowerCase().trim()

  if (searchText === "") {
    displayWarningStudents(allStudentsForWarning)
  } else {
    const filteredStudents = allStudentsForWarning.filter((student) => {
      const displayName = getProperName(student).toLowerCase()
      const displayUID = getProperUID(student, student.id).toLowerCase()

      return displayName.includes(searchText) || displayUID.includes(searchText)
    })
    displayWarningStudents(filteredStudents)
  }
}

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
  ctx.fillText(principalName, canvas.width - 50, yPosition)
  yPosition += 20
  ctx.fillText(`NIP. ${principalNIP}`, canvas.width - 50, yPosition)

  // Download the image
  const link = document.createElement("a")
  link.download = `Surat_Panggilan_${spType}_${studentData.name || "Siswa"}.png`
  link.href = canvas.toDataURL()
  link.click()

  showDialog(`Surat panggilan ${spType} untuk ${studentData.name} berhasil diunduh!`)
}

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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideDeleteModal()
    hideResetModal()
    hideDialog()
  }
})
