from flask import Flask, request, jsonify, render_template, send_from_directory, session
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import time
import cv2
from google.cloud import storage
from tensorflow.keras.models import load_model
import json
from user_database import register_user,login_user,view_users,insert_photo,retrieve_user_history
import base64

app = Flask(__name__, static_folder='static', template_folder='templates')

CORS(app) # 允許跨域請求

app.secret_key =  os.urandom(24)

UPLOAD_FOLDER = 'project/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}



model = load_model('SKIN_DIAGNOSE/model_extended.h5') # Now load_model uses the local path, which might have been just downloaded from GCS
classes = {7: ('nm','normal'), 4: ('nv', ' melanocytic nevi'), 6: ('mel', 'melanoma'), 2 :('bkl', 'benign keratosis-like lesions'), 1:('bcc' , ' basal cell carcinoma'), 5: ('vasc', ' pyogenic granulomas and hemorrhage'), 0: ('akiec', 'Actinic keratoses and intraepithelial carcinomae'),  3: ('df', 'dermatofibroma')}
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    success, message = register_user(username, password)
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'message': message}), 400
    
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    print(f"Login username {username}")
    password = data.get('password')
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    success, user = login_user(username, password)
    if success:
        session['user'] = username  # 假設 user['id'] 是用戶 ID
        return jsonify({'message': '登入成功'}), 200
    else:
        return jsonify({'message': user}), 401
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join('project/uploads', filename)
        print(f"filepath {filepath}")
        file.save(filepath)
        
        # 模擬分析過程
        print("analyzing ...")
        result = analyze_image(filepath)
        print(f"Session : {session}")
        username = session.get('user')
        print(f'username {username}')
        if not username:
            return jsonify({'error': 'User not logged in'}), 401
        
        insert_photo(username, filepath, f"{result['disease']}: {result['confidence']}")
        
        return jsonify(result)
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def analyze_image(image_path):
    img = cv2.imread(image_path)
    img = cv2.resize(img, (28, 28))  # Resize the image to match the model's expected input
    img = img.reshape(1, 28, 28, 3)  # Reshape for the model (assuming your model expects this shape)
    img = img / 255.0  # Normalize the image if your model expects pixel values in [0, 1]

    result = model.predict(img)
    max_prob = max(result[0])
    class_ind = list(result[0]).index(max_prob)
    class_name = classes[class_ind]

    return {
        'status': 'success',
        'disease': class_name,
        'confidence': round(max_prob * 100, 2)
    }
    
@app.route('/history', methods=['GET'])
def history():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 401

    history_data = retrieve_user_history(username)
    encoded_history = []
    #print(f"Encodede history {encoded_history}")
    for item in history_data:
        encoded_photo = base64.b64encode(item['photo']).decode('utf-8')
        encoded_history.append({
            'upload_time': item['upload_time'].strftime('%Y-%m-%d %H:%M:%S'),
            'photo': encoded_photo,
            'diagnosis': item['diagnosis']
        })

    return jsonify({'history': encoded_history})

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)

