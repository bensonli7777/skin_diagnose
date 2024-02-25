from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import time

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app) # 允許跨域請求

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        file.save(filepath)
        
        # 模拟分析过程
        result = simulate_analysis(filepath)
        
        return jsonify(result)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def simulate_analysis(image_path):
    # 模拟分析过程需要一些时间
    time.sleep(10)  # 模拟耗时操作
    # 返回模拟结果
    return {
        'status': 'success',
        'disease': 'Acne',
        'confidence': 98.5
    }

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
