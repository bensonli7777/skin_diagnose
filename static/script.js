document.getElementById('startButton').addEventListener('click', function() {
    switchScreen('captureScreen');
    openCamera();
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureButton').addEventListener('click', function() {
        captureImage();
    });
});

let cropper;

function openCamera() {
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }
        })
        .then(function(stream) {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.style.display = 'block';
            video.play();
            document.getElementById('captureButton').style.display = 'block';
        })
        .catch(function(error) {
            console.log("获取摄像头失败", error);
        });
}



// 更新裁切并上传的函数以包括进度条逻辑
document.getElementById('cropButton').addEventListener('click', function() {
    const croppedCanvas = cropper.getCroppedCanvas();
    croppedCanvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'croppedImage.png');
        
        // 显示进度条
        document.getElementById('progressContainer').style.display = 'block';
        let progressBar = document.getElementById('progressBar');
        progressBar.style.width = '0%'; // 重置进度条
        
        // 模拟进度更新
        let progress = 0;
        let interval = setInterval(() => {
            if (progress < 100) {
                progress += 10; // 模拟每隔一段时间进度增加
                progressBar.style.width = progress + '%';
            } else {
                clearInterval(interval);
                document.getElementById('progressContainer').style.display = 'none';
            }
        }, 200);
        
        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('uploadResult').innerHTML = '上传成功: ' + JSON.stringify(data);
            // 显示分析结果
            document.getElementById('analysisResult').style.display = 'block';
            document.getElementById('analysisResult').innerHTML = `
                分析结果: ${data.disease} <br>
                置信度: ${data.confidence}%
            `;
        })
        .catch(error => {
            console.error('上传错误:', error);
            document.getElementById('uploadResult').innerHTML = '上传错误: ' + error;
        });
    });
});

function captureImage() {
    console.log("拍照函数被调用"); // 添加这行来检查函数是否被调用
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    video.srcObject.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    
    const imageDataUrl = canvas.toDataURL('image/png');
    const preview = document.getElementById('preview');
    preview.src = imageDataUrl;
    preview.style.display = 'block';
    
    cropper = new Cropper(preview, {
        aspectRatio: 1,
        viewMode: 1,
    });
    
    document.getElementById('cropContainer').style.display = 'block';
    document.getElementById('cropButton').style.display = 'inline';
    switchScreen('cropScreen');
}


document.getElementById('cropButton').addEventListener('click', function() {
    cropAndUploadImage();
});

function cropAndUploadImage() {
    cropper.getCroppedCanvas().toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'croppedImage.png');
        
        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('uploadResult').innerHTML = '上传成功: ' + JSON.stringify(data);
            switchScreen('resultScreen');
        })
        .catch(error => {
            console.error('上传错误:', error);
            document.getElementById('uploadResult').innerHTML = '上传错误: ' + error;
        });
    });
}

document.getElementById('restartButton').addEventListener('click', function() {
    switchScreen('welcomeScreen');
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(screen) {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
