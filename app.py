from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import time
import cv2
from google.cloud import storage
from tensorflow.keras.models import load_model
import json

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app) # 允許跨域請求

UPLOAD_FOLDER = 'project/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


MODEL_PATH = 'project/best_model.h5'  # Model path in your local directory
MODEL_BUCKET = 'cpp-project-415117.appspot.com'  # GCS bucket where the model is stored
MODEL_BLOB_NAME = 'best_model.h5'  # Model file name in GCS bucket

def download_model_from_gcs():
    """Download the model from Google Cloud Storage if it's not present."""
    service_account_path = 'project/cpp-project-415117-5422981ba4ba.json'  # 请确保此路径指向您的 JSON 密钥文件
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
    if not os.path.exists(MODEL_PATH):
        print("Download modle from icloud")
        client = storage.Client()
        bucket = client.bucket(MODEL_BUCKET)
        blob = bucket.blob(MODEL_BLOB_NAME)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        blob.download_to_filename(MODEL_PATH)
        print(f"Model {MODEL_BLOB_NAME} downloaded from bucket {MODEL_BUCKET} to {MODEL_PATH}.")

download_model_from_gcs()
model = load_model(MODEL_PATH)  # Now load_model uses the local path, which might have been just downloaded from GCS
classes = {4: ('nv', ' melanocytic nevi'), 6: ('mel', 'melanoma'), 2 :('bkl', 'benign keratosis-like lesions'), 1:('bcc' , ' basal cell carcinoma'), 5: ('vasc', ' pyogenic granulomas and hemorrhage'), 0: ('akiec', 'Actinic keratoses and intraepithelial carcinomae'),  3: ('df', 'dermatofibroma')}

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
        filepath = os.path.join('project/uploads', filename)
        file.save(filepath)
        
        # 模拟分析过程
        result = analyze_image(filepath)
        
        return jsonify(result)

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


if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
