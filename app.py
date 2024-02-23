from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # 允许跨域请求

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    # 这里添加处理图片的代码
    # 假设返回一个简单的结果
    result = {'message': 'Image received', 'status': 'success'}
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
