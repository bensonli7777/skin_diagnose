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
        video.play();
        video.style.display = 'block'; // 显示 video 元素
        document.getElementById('captureButton').style.display = 'block';
    })
    .catch(function(error) {
        console.error("获取摄像头失败", error);
    });
}
function captureImage() {
    const video = document.getElementById('video');
    console.log("嘗試捕捉照片")
    // 检查video是否有srcObject属性，且srcObject不是null
    if (video && video.srcObject) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 现在可以安全地停止媒体流
        video.srcObject.getTracks().forEach(track => track.stop());
        
        // 隐藏video元素
        video.style.display = 'none';
        
        const imageDataUrl = canvas.toDataURL('image/png');
        const preview = document.getElementById('preview');
        preview.src = imageDataUrl;
        preview.style.display = 'block';
        
        // 初始化裁切器
        if (cropper) {
            cropper.destroy(); // 销毁旧的裁切实例
        }
        cropper = new Cropper(preview, {
            aspectRatio: 1,
            viewMode: 1,
        });
        console.log("Cropper has been initialized.");
        
        // 显示裁切容器和裁切按钮
        switchScreen('cropScreen');
        document.getElementById('cropContainer').style.display = 'block';
        document.getElementById('cropButton').style.display = 'block';
    } else {
        console.error("無法訪問攝像頭");
    }
}
 


document.getElementById('cropButton').addEventListener('click', function() {
    cropAndUploadImage();
});
function cropAndUploadImage() {
    cropper.getCroppedCanvas().toBlob(function(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'croppedImage.png');

        // Start showing the progress bar
        showProgress();

        // Use fetch to upload the cropped image to the server
        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log("Upload and analysis complete", data);
            // Handle the server response here
            showResult({
                status: data.status,
                disease: data.disease,
                confidence: data.confidence + '%',
                imageSrc: URL.createObjectURL(blob) // Display the local cropped image
            });
        })
        .catch(error => {
            console.error("Error uploading image:", error);
        })
        .finally(() => {
            // Hide the progress bar here or in the .then block
        });
    });
}


function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    progressContainer.style.display = 'none';//turn this into none to hide it. Turn on :block
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            progressContainer.style.display = 'none';
            progressBar.style.width = `0%`;
            
        } 
    }, 300);
}

function showResult(data) {
    switchScreen('resultScreen');
    
    // Ensure the cropped image is shown
    const croppedImageElement = document.getElementById('croppedImage');
    croppedImageElement.src = data.imageSrc; // Set the source of the cropped image

    // Display the analysis result
    const analysisResultElement = document.getElementById('analysisResult');
    analysisResultElement.innerHTML = `
        <p>診斷結果</p>
        <div class="result-conclusion">${data.disease} 概率 ${data.confidence}</div>
    `;
    analysisResultElement.style.display = 'flex'; // Ensure this element is displayed

    document.getElementById('restartButton').style.display = 'block';
}


document.getElementById('restartButton').addEventListener('click', function() {
    switchScreen('welcomeScreen');
    document.getElementById('analysisResult').style.display = 'none';
    document.getElementById('restartButton').style.display = 'none';
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
