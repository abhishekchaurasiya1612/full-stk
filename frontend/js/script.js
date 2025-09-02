const API_URL = 'http://localhost:5001/api';
let students = [];

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById(`${page}-page`).style.display = 'block';
        if (page === 'students') {
            loadStudents();
        }
    });
});

// Load students
async function loadStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);
        students = await response.json();
        displayStudents();
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students');
    }
}

// Display students in table
function displayStudents() {
    const tbody = document.getElementById('students-list');
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.roll_number}</td>
        </tr>
    `).join('');
}

// Add new student
document.getElementById('add-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const rollNumber = document.getElementById('roll-number').value;

    try {
        const response = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                roll_number: rollNumber
            })
        });

        if (response.ok) {
            document.getElementById('student-name').value = '';
            document.getElementById('roll-number').value = '';
            loadStudents();
        } else {
            alert('Error adding student');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student');
    }
});

// Load attendance for a specific date
async function loadAttendance() {
    const date = document.getElementById('attendance-date').value;
    if (!date) {
        alert('Please select a date');
        return;
    }

    try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
            fetch(`${API_URL}/students`),
            fetch(`${API_URL}/attendance/${date}`)
        ]);

        const students = await studentsResponse.json();
        const attendance = await attendanceResponse.json();

        displayAttendance(students, attendance, date);
    } catch (error) {
        console.error('Error loading attendance:', error);
        alert('Error loading attendance');
    }
}

// Display attendance form
function displayAttendance(students, attendance, date) {
    const tbody = document.getElementById('attendance-list');
    tbody.innerHTML = students.map(student => {
        const studentAttendance = attendance.find(a => a.student_id === student.id);
        const status = studentAttendance ? studentAttendance.status : '';

        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.roll_number}</td>
                <td>
                    <select class="form-select" id="status-${student.id}">
                        <option value="">Select status</option>
                        <option value="present" ${status === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${status === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="late" ${status === 'late' ? 'selected' : ''}>Late</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="markAttendance(${student.id})">
                        ${status ? 'Update' : 'Mark'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Mark attendance for a student
async function markAttendance(studentId) {
    const date = document.getElementById('attendance-date').value;
    const status = document.getElementById(`status-${studentId}`).value;

    if (!status) {
        alert('Please select a status');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: studentId,
                date: date,
                status: status
            })
        });

        if (response.ok) {
            loadAttendance();
        } else {
            alert('Error marking attendance');
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        alert('Error marking attendance');
    }
}

// Load students on page load
loadStudents();
