from datetime import datetime
import os
import random
import string
import uuid
from flask import Flask, abort, jsonify,render_template, request, send_file
from flask_cors import CORS
import mysql.connector
from dateutil import parser
from werkzeug.utils import secure_filename
from flask import current_app
from wtforms import validators
from flask_admin.form import Select2Widget
from wtforms.fields import SelectField




app = Flask(__name__)
CORS(app)

# from flask_admin import Admin
# from flask_admin.contrib.sqla import ModelView
# from flask_sqlalchemy import SQLAlchemy

# # SQLAlchemy config for Flask-Admin
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:12345@localhost:3308/japido_data'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db = SQLAlchemy(app)

# class UserCreds(db.Model):
#     __tablename__ = 'users_creds'
#     id = db.Column(db.Integer, primary_key=True)
#     fullname = db.Column(db.String(100))
#     email = db.Column(db.String(100), unique=True)
#     password = db.Column(db.String(100))
#     user_type = db.Column(db.String(50))

# class JobList(db.Model):
#     __tablename__ = 'joblist'
#     id = db.Column(db.Integer, primary_key=True)
#     job_id = db.Column(db.String(255), unique=True)
#     title = db.Column(db.String(255))
#     department = db.Column(db.String(255))
#     company = db.Column(db.String(255))
#     type = db.Column(db.String(100))
#     experience = db.Column(db.String(100))
#     country = db.Column(db.String(100))
#     city = db.Column(db.String(100))
#     is_remote = db.Column(db.Boolean)
#     description = db.Column(db.Text)
#     requirements = db.Column(db.Text)
#     skills = db.Column(db.Text)
#     education = db.Column(db.Text)
#     min_salary = db.Column(db.Float)
#     max_salary = db.Column(db.Float)
#     show_salary = db.Column(db.Boolean)
#     contact_email = db.Column(db.String(100))
#     deadline = db.Column(db.Date)
#     status = db.Column(db.String(50))
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
#     company_logo = db.Column(db.String(255))

# class JobApplication(db.Model):
#     __tablename__ = 'job_applications'
#     id = db.Column(db.Integer, primary_key=True)
#     job_id = db.Column(db.String(255))
#     name = db.Column(db.String(100))
#     email = db.Column(db.String(100))
#     mobile = db.Column(db.String(15))
#     resume_filename = db.Column(db.String(255))
#     applied_at = db.Column(db.DateTime, default=datetime.utcnow)
#     company = db.Column(db.String(255))
#     location = db.Column(db.String(255))
#     job_title = db.Column(db.String(255))
    

# class JobListAdmin(ModelView):
#     column_searchable_list = ['title', 'company', 'skills']       # ✅ list
#     column_filters = ['type', 'country', 'city']                  # ✅ list
#     can_create = True
#     can_edit = True
#     can_delete = True
    
# class UserCredsAdmin(ModelView):
#     form_columns = ['fullname', 'email', 'password', 'user_type']
    
#     column_labels = {
#         'fullname': 'Full Name',
#         'email': 'Email Address',
#         'password': 'Password',
#         'user_type': 'User Type'
#     }

#     form_overrides = {
#         'user_type': SelectField
#     }

#     form_args = {
#         'user_type': {
#             'choices': [('jobSeeker', 'Job Seeker'), ('hr', 'HR Professional')],
#             'widget': Select2Widget()
#         }
#     }
    



    
# admin = Admin(app, name='Japido Admin', template_mode='bootstrap4')
# admin.add_view(ModelView(UserCreds, db.session))
# admin.add_view(JobListAdmin(JobList, db.session))
# admin.add_view(ModelView(JobApplication, db.session))

@app.route('/admin/')
def admin():
    return render_template('admin.html')

@app.route('/api/users', methods=['GET'])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, fullname, email, user_type FROM users_creds")
        users = cursor.fetchall()
        return jsonify(users)
    except mysql.connector.Error as err:
        return jsonify({"error": f"MySQL Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    fullname = data.get('fullname')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # First check if user already exists
        cursor.execute("SELECT email FROM users_creds WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already registered!"}), 400

        # Insert with user type
        cursor.execute("""
            INSERT INTO users_creds (fullname, email, password, user_type) 
            VALUES (%s, %s, %s, %s)
        """, (str(fullname), str(email), str(password), str(user_type)))
        conn.commit()
        return jsonify({"message": "Registration successful!"})
    except mysql.connector.Error as err:
        return jsonify({"message": f"MySQL Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/jobs', methods=['POST'])
def admin_jobs():
    try:
        # Handle file upload if present
        logo_file = request.files.get('logo')
        logo_filename = None
        
        if logo_file and logo_file.filename:
            logo_filename = secure_filename(logo_file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            logo_path = os.path.join(upload_folder, logo_filename)
            logo_file.save(logo_path)

        
        data = request.form.to_dict()
        
        
        job_id = data.get('job_id') or "Job"+''.join(random.choices(string.digits, k=4))

        
        is_remote = data.get('isRemote', 'false').lower() == 'true'
        show_salary = data.get('showSalary', 'false').lower() == 'true'

        # Parse deadline date
        deadline_date = None
        deadline_str = request.form.get('deadline')

        if deadline_str:
            try:
                # Try ISO format (YYYY-MM-DD)
                deadline_date = datetime.strptime(deadline_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    # Try other common formats if needed
                    deadline_date = datetime.strptime(deadline_str, '%m/%d/%Y').date()
                except ValueError:
                    return jsonify({
                        "message": "Invalid deadline format. Use YYYY-MM-DD",
                        "received_format": deadline_str
                    }), 400

        # Insert data into the database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO joblist (
                job_id, title, department, company, company_logo, type, experience, 
                country, city, is_remote, description, requirements, skills, 
                min_salary, max_salary, show_salary, contact_email, deadline, education
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            job_id, data.get('title'), data.get('department'), data.get('company'), logo_filename,
            data.get('type'), data.get('experience'), data.get('country'), data.get('city'),
            is_remote, data.get('description'), data.get('requirements'), data.get('skills'),
            data.get('minSalary'), data.get('maxSalary'), show_salary, 
            data.get('contactEmail'), deadline_date, data.get('education')
        ))
        
        conn.commit()
        return jsonify({
            "message": "Job posted successfully!",
            "job_id": job_id
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error posting job: {str(e)}")
        return jsonify({"message": f"Error posting job: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

from flask import jsonify, abort
import mysql.connector

@app.route('/admin/applicants')
def view_admin_applicants():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch all job applicants
        cursor.execute("""
            SELECT name, job_title, company, resume_filename, applied_at
            FROM job_applications
            ORDER BY applied_at DESC
        """)
        
        applicants = cursor.fetchall()

        # Format date for JSON
        for applicant in applicants:
            if applicant['applied_at']:
                applicant['applied_at'] = applicant['applied_at'].strftime('%Y-%m-%d %H:%M')

        return jsonify(applicants)

    except mysql.connector.Error as err:
        abort(500, description=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()




def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='12345',
        port = 3308,
        database='japido_data'
    )



@app.route('/')
def home():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get the 3 most recent jobs
        cursor.execute("""
            SELECT * FROM joblist
            ORDER BY created_at DESC 
            LIMIT 3
        """)
        recent_jobs = cursor.fetchall()
        
        # Convert datetime objects to strings for template rendering
        for job in recent_jobs:
            if job['created_at']:
                job['posted_date'] = job['created_at'].strftime('%Y-%m-%d')
            else:
                job['posted_date'] = 'Recently'
                
        return render_template('home.html', recent_jobs=recent_jobs)
        
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return render_template('home.html', recent_jobs=[])
    finally:
        cursor.close()
        conn.close()
        
def time_ago(dt):
    now = datetime.now()
    diff = now - dt
    
    periods = [
        ('year', 365*24*60*60),
        ('month', 30*24*60*60),
        ('day', 24*60*60),
        ('hour', 60*60),
        ('minute', 60)
    ]
    
    for period, seconds in periods:
        value = diff.total_seconds() / seconds
        if value >= 1:
            return f"{int(value)} {period}{'s' if value > 1 else ''} ago"
    return "just now"

app.jinja_env.filters['time_ago'] = time_ago

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    fullname = data.get('name')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'jobSeeker')  # Default to jobSeeker if not provided

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # First check if user already exists
        cursor.execute("SELECT email FROM users_creds WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already registered!"}), 400

        # Insert with user type
        cursor.execute("""
            INSERT INTO users_creds (fullname, email, password, user_type) 
            VALUES (%s, %s, %s, %s)
        """, (str(fullname), str(email), str(password), str(user_type)))
        conn.commit()
        return jsonify({"message": "Registration successful!"})
    except mysql.connector.Error as err:
        return jsonify({"message": f"MySQL Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

        
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('username')
    password = data.get('password')
    requested_user_type = data.get('userType')  # The type the user selected during login

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT fullname, email, user_type 
            FROM users_creds 
            WHERE email = %s AND password = %s
        """, (email, password))
        user = cursor.fetchone()
        
        if user:
            # Verify the user's actual type matches what they selected
            if user['user_type'] != requested_user_type:
                return jsonify({
                    "message": f"Please login as {user['user_type']} (you selected {requested_user_type})"
                }), 401
                
            return jsonify({
                "message": "Login successful!",
                "user": {
                    "fullname": user['fullname'],
                    "email": user['email'],
                    "userType": user['user_type']
                }
            })
        else:
            return jsonify({"message": "Invalid email or password"}), 401
    except mysql.connector.Error as err:
        return jsonify({"message": f"MySQL Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()
        
@app.route('/jobs')
def jobs():
    # Get filter parameters from URL
    location = request.args.get('location', '')
    workmode = request.args.get('workmode', '')
    experience = request.args.get('experience', '')
    keyword = request.args.get('keyword', '')
    job_type = request.args.get('jobType', '')

    
    # You can pass these filters to your template if needed
    return render_template('jobs.html', 
                         location_filter=location,
                         workmode_filter=workmode,
                         experience_filter=experience,
                         keyword_filter=keyword,
                         job_type_filter=job_type)

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    location = request.args.get('location', '').strip()
    workmode = request.args.get('jobType', '').strip()  # e.g., 'Remote' or 'On-site'
    experience = request.args.get('experience', '').strip()
    keyword = request.args.get('keyword', '').strip().lower()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT id, title, company, department, city, country, is_remote,
                   type, experience, description, requirements, skills,
                   min_salary, max_salary, show_salary, contact_email,
                   deadline, status, created_at
            FROM joblist
            WHERE 1=1
        """
        params = []

        # Filter by city or country (location)
        if location:
            query += " AND (LOWER(city) = %s OR LOWER(country) = %s)"
            params.extend([location.lower(), location.lower()])

        # Filter by remote/in-office
        if workmode:
            if workmode.lower() == 'remote':
                query += " AND is_remote = TRUE"
            elif workmode.lower() == 'on-site':
                query += " AND is_remote = FALSE"

        # Filter by experience (exact match)
        if experience:
            query += " AND LOWER(experience) LIKE %s"
            params.append(f"%{experience.lower()}%")

        # Filter by keyword in title or skills
        if keyword:
            query += " AND (LOWER(title) LIKE %s OR LOWER(skills) LIKE %s)"
            params.extend([f"%{keyword}%", f"%{keyword}%"])

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        jobs = cursor.fetchall()
        return jsonify(jobs)
    except mysql.connector.Error as err:
        return jsonify({"message": f"MySQL Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()




@app.route('/postjobs')
def postjobs():
    return render_template("postjobs.html")



@app.route('/api/jobs', methods=['POST'])
def post_job():
    try:
        # Handle file upload if present
        logo_file = request.files.get('logo')
        logo_filename = None
        
        if logo_file and logo_file.filename:
            logo_filename = secure_filename(logo_file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            logo_path = os.path.join(upload_folder, logo_filename)
            logo_file.save(logo_path)

        # Get form data
        data = request.form.to_dict()
        
        # Generate UUID for the job_id if not provided
        job_id = data.get('job_id') or "Job"+''.join(random.choices(string.digits, k=4))

        # Parse boolean values
        is_remote = data.get('isRemote', 'false').lower() == 'true'
        show_salary = data.get('showSalary', 'false').lower() == 'true'

        # Parse deadline date
        deadline_date = None
        deadline_str = request.form.get('deadline')

        if deadline_str:
            try:
                # Try ISO format (YYYY-MM-DD)
                deadline_date = datetime.strptime(deadline_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    # Try other common formats if needed
                    deadline_date = datetime.strptime(deadline_str, '%m/%d/%Y').date()
                except ValueError:
                    return jsonify({
                        "message": "Invalid deadline format. Use YYYY-MM-DD",
                        "received_format": deadline_str
                    }), 400

        # Insert data into the database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO joblist (
                job_id, title, department, company, company_logo, type, experience, 
                country, city, is_remote, description, requirements, skills, 
                min_salary, max_salary, show_salary, contact_email, deadline, education
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            job_id, data.get('title'), data.get('department'), data.get('company'), logo_filename,
            data.get('type'), data.get('experience'), data.get('country'), data.get('city'),
            is_remote, data.get('description'), data.get('requirements'), data.get('skills'),
            data.get('minSalary'), data.get('maxSalary'), show_salary, 
            data.get('contactEmail'), deadline_date, data.get('education')
        ))
        
        conn.commit()
        return jsonify({
            "message": "Job posted successfully!",
            "job_id": job_id
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error posting job: {str(e)}")
        return jsonify({"message": f"Error posting job: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        
@app.route('/job/<job_id>')
def job_detail(job_id):
    job = get_job_by_id(job_id)
    if not job:
        return "Job not found", 404
    return render_template("jobdetails.html", job=job)


def get_job_by_id(job_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM joblist WHERE id = %s", (job_id,))
        job = cursor.fetchone()
        return job
    except mysql.connector.Error:
        return None
    finally:
        cursor.close()
        conn.close()
        

@app.route('/viewjob/<job_id>')
def view_detail(job_id):
    job = get_job_by_jobid(job_id)
    if not job:
        return "Job not found", 404
    return render_template("jobdetails.html", job=job)


def get_job_by_jobid(job_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM joblist WHERE job_id = %s", (job_id,))
        job = cursor.fetchone()
        return job
    except mysql.connector.Error:
        return None
    finally:
        cursor.close()
        conn.close()

@app.route('/applyjobs')
def applyjobs():
    return render_template("applyjobs.html")

@app.route('/postedjobs')
def postedjobs():
    return render_template("postedjobs.html")

@app.route('/api/check-application', methods=['POST'])
def check_application():
    try:
        data = request.get_json()
        email = data.get('email')
        job_id = data.get('job_id')

        if not email or not job_id:
            return jsonify({'error': 'Missing email or job_id'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if application exists
        cursor.execute("""
            SELECT id FROM job_applications 
            WHERE email = %s AND job_id = %s
            LIMIT 1
        """, (email, job_id))
        
        result = cursor.fetchone()

        return jsonify({'applied': result is not None}), 200

    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()



# UPLOAD_FOLDER = 'uploads'
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/apply', methods=['POST'])
def apply_job():
    try:
        # Validate required fields
        required_fields = ['name', 'email', 'mobile', 'job_id']
        for field in required_fields:
            if field not in request.form or not request.form[field].strip():
                return jsonify({'error': f'{field} is required'}), 400

        # Get form data
        name = request.form['name'].strip()
        email = request.form['email'].strip()
        mobile = request.form['mobile'].strip()
        job_id = request.form['job_id'].strip()
        job_title = request.form['job_title'].strip()
        company = request.form['company'].strip() 
        location = request.form['location'].strip()

        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate file exists
        if 'resume' not in request.files:
            return jsonify({'error': 'Resume file is required'}), 400

        resume = request.files['resume']
        
        if resume.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Validate file extension
        allowed_extensions = {'pdf', 'doc', 'docx'}
        filename = secure_filename(resume.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'Allowed file types are PDF, DOC, DOCX'}), 400

        # Save resume
        unique_filename = f"{job_id}_{name.replace(' ', '_')}_{filename}"
        secure_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        resume.save(secure_path)

        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
    

        # Insert application (you need a `job_applications` table)
        cursor.execute("""
            INSERT INTO job_applications 
            (job_id, name, email, mobile, resume_filename,company,location,job_title) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (job_id, name, email, mobile, unique_filename,company,location,job_title))
        conn.commit()

        return jsonify({
            'message': 'Application submitted successfully',
            'filename': unique_filename
        }), 200

    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


@app.route('/api/posted-jobs')
def postedjobslist():
    user_email = request.args.get('email')

    if not user_email:
        return jsonify({'message': 'Email is required to fetch posted jobs'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                j.id, j.job_id, j.title, j.department, j.company, j.type, 
                j.experience, j.country, j.city, j.is_remote, j.description, 
                j.requirements, j.skills, j.min_salary, j.max_salary, 
                j.show_salary, j.contact_email, j.deadline, j.status, 
                j.created_at,
                COUNT(a.id) as application_count
            FROM joblist j
            LEFT JOIN job_applications a ON j.job_id = a.job_id
            WHERE j.contact_email = %s
            GROUP BY j.id
            ORDER BY j.created_at DESC
        """, (user_email,))
        
        posted_jobs = cursor.fetchall()

        # Format dates
        for job in posted_jobs:
            job['posted_date'] = job['created_at'].strftime('%Y-%m-%d') if job['created_at'] else 'Recently'
            job['deadline'] = job['deadline'].strftime('%Y-%m-%d') if job['deadline'] else 'Not set'

        return jsonify(posted_jobs)

    except mysql.connector.Error as err:
        print("Database Error:", err)
        return jsonify({'message': f"Database Error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/applicants/<job_id>')
def view_applicants(job_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get job details
        cursor.execute("SELECT id, title FROM joblist WHERE job_id = %s", (job_id,))
        job = cursor.fetchone()
        
        if not job:
            abort(404, description="Job not found")

        # Get applicants
        cursor.execute("""
            SELECT id, name, email, mobile, resume_filename, 
                   applied_at
            FROM job_applications
            WHERE job_id = %s
            ORDER BY applied_at DESC
        """, (job_id,))
        
        applicants = cursor.fetchall()

        # Format dates for display
        for applicant in applicants:
            if applicant['applied_at']:
                applicant['applied_at'] = applicant['applied_at'].strftime('%Y-%m-%d %H:%M')
            
        return render_template('applicants.html', 
                            job_title=job['title'],
                            job_id=job_id,
                            applicants=applicants)

    except mysql.connector.Error as err:
        abort(500, description=f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()
        
# ✅ Set the folder where resumes are stored
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

# ✅ Ensure the uploads folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/download-resume/<filename>')
def download_resume(filename):
    safe_filename = os.path.basename(filename)
    resume_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
    
    print("Looking for file at:", resume_path)  # Debug line
    
    if os.path.exists(resume_path):
        return send_file(resume_path, as_attachment=False)
    else:
        abort(404)
 
@app.route('/api/applied-jobs', methods=['GET'])
def get_applied_jobs():
    try:
        # Get the logged-in user's email (you can fetch from session or JWT)
        user_email = request.args.get('email')  # Get email from query params
        
        if not user_email:
            return jsonify({'error': 'Email is required'}), 400

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch jobs applied by the user based on email
        cursor.execute("""
            SELECT id, job_id, name, email, mobile, resume_filename, applied_at, company, location, job_title
            FROM job_applications
            WHERE email = %s
            ORDER BY applied_at DESC
        """, (user_email,))
        applied_jobs = cursor.fetchall()


        if not applied_jobs:
            return jsonify({'message': 'No applied jobs found'}), 404

        return jsonify({'applied_jobs': applied_jobs}), 200

    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

    finally:
        # Ensure proper cleanup
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
@app.route('/delete/jobs/<job_id>',methods=['DELETE'])
def delete_job(job_id):
    try:
     # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DELETE FROM joblist WHERE id = %s", (job_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Job not found'}), 404

        return jsonify({'message': 'Job deleted successfully'}), 200

    except Exception as e:
        print("Error deleting job:", e)
        return jsonify({'message': 'Internal Server Error'}), 500

    finally:
        cursor.close()
        conn.close()
    
    
@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.json
        email = data.get('email')
        user_type = data.get('userType')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users_creds WHERE email = %s AND user_type = %s"
        cursor.execute(query, (email, user_type))
        user = cursor.fetchone()  # Just get one

        return jsonify({'exists': bool(user)})
    except Exception as e:
        print("Error verifying email:", e)
        return jsonify({'message': 'Internal Server Error'}), 500
    
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get('email')
        user_type = data.get('userType')
        new_password = data.get('password')


        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users_creds SET password = %s WHERE email = %s AND user_type = %s",
            (new_password, email, user_type)
        )
        conn.commit()
        rows_updated = cursor.rowcount
        cursor.close()
        conn.close()

        if rows_updated:
            return jsonify({'message': 'Password updated successfully'})
        else:
            return jsonify({'message': 'Failed to update password'}), 400
    except Exception as e:
        print("Error resetting password:", e)
        return jsonify({'message': 'Internal Server Error'}), 500



if __name__ == '__main__':
    app.run(debug=True)
    
    