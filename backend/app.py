from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
db_user = os.environ.get('DB_USER', 'root')
db_password = os.environ.get('DB_PASSWORD', 'root')
db_host = os.environ.get('DB_HOST', 'db')
db_name = os.environ.get('DB_NAME', 'attendance')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'mysecretkey')

db = SQLAlchemy(app)

# Models
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=False)
    attendances = db.relationship('Attendance', backref='student', lazy=True)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)  # present, absent, late
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes
@app.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([{
        'id': student.id,
        'name': student.name,
        'roll_number': student.roll_number
    } for student in students])

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    student = Student(name=data['name'], roll_number=data['roll_number'])
    db.session.add(student)
    try:
        db.session.commit()
        return jsonify({'message': 'Student added successfully'}), 201
    except:
        db.session.rollback()
        return jsonify({'message': 'Error adding student'}), 400

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    attendance = Attendance(
        student_id=data['student_id'],
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        status=data['status']
    )
    db.session.add(attendance)
    try:
        db.session.commit()
        return jsonify({'message': 'Attendance marked successfully'}), 201
    except:
        db.session.rollback()
        return jsonify({'message': 'Error marking attendance'}), 400

@app.route('/api/attendance/<date>', methods=['GET'])
def get_attendance(date):
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        attendances = Attendance.query.filter_by(date=date_obj).all()
        return jsonify([{
            'id': attendance.id,
            'student_id': attendance.student_id,
            'student_name': attendance.student.name,
            'status': attendance.status,
            'date': attendance.date.strftime('%Y-%m-%d')
        } for attendance in attendances])
    except:
        return jsonify({'message': 'Error fetching attendance'}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
