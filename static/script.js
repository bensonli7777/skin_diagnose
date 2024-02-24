let cropper;
let imageDataUrl;

// 捕捉图像
navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.style.display = 'block'; // 确保视频元素是可见的
        video.play(); // 开始播放视频流
    })
    .catch(function(error) {
        console.log("獲取攝像頭失敗", error);
    });


// 准备裁切
document.getElementById('video').addEventListener('click', function() {
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 停止视频流
    video.srcObject.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    
    imageDataUrl = canvas.toDataURL('image/png');
    document.getElementById('preview').src = imageDataUrl;
    document.getElementById('preview').style.display = 'block';
    
    // 初始化裁切
    cropper = new Cropper(document.getElementById('preview'), {
        aspectRatio: 16 / 9, // 可以根据需要调整裁切比例
        viewMode: 1,
    });
    
    document.getElementById('cropContainer').style.display = 'block';
    document.getElementById('cropButton').style.display = 'inline';
});

// 裁切并上传
document.getElementById('cropButton').addEventListener('click', function() {
    const croppedCanvas = cropper.getCroppedCanvas();
    croppedCanvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'croppedImage.png');
        
        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('uploadResult').innerText = '上傳成功: ' + JSON.stringify(data);
        })
        .catch(error => {
            console.error('上傳錯誤:', error);
            document.getElementById('uploadResult').innerText = '上傳錯誤: ' + error;
        });
    });
});
