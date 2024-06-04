
document.getElementById('startButton').addEventListener('click', function() {
    switchScreen('captureScreen');
    openCamera(); // 這裡預設按下start後會直接打開相機鏡頭
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('captureButton').addEventListener('click', function() {
        captureImage();
    });
    document.getElementById('uploadButton').addEventListener('click', function() {
        document.getElementById('uploadInput').click();
    });
    document.getElementById('uploadInput').addEventListener('change', function(event) {
        uploadImage(event);
    });
});

// 關掉的這部分是之後寫reset function會用到
/*
document.addEventListener('DOMContentLoaded', function() {
    const captureButton = document.getElementById('captureButton');
    const uploadButton = document.getElementById('uploadButton');
    const uploadInput = document.getElementById('uploadInput');
    const cropButton = document.getElementById('cropButton');
    const restartButton = document.getElementById('restartButton');

    captureButton.addEventListener('click', captureImage);
    uploadButton.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', uploadImage);
    cropButton.addEventListener('click', cropAndUploadImage);
    restartButton.addEventListener('click', () => {
        resetAppState();
        switchScreen('welcomeScreen');
    });
});
*/

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
 
function uploadImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            displayImageForCrop(e.target.result);
        }
        reader.readAsDataURL(file);
    }
}

function displayImageForCrop(imageDataUrl) {
    const preview = document.getElementById('preview');
    preview.src = imageDataUrl;
    preview.style.display = 'block';
    preview.style.maxWidth = '100%';  
    preview.style.maxHeight = '80vh'; 

    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(preview, {
        aspectRatio: 1,
        viewMode: 1,
    });

    switchScreen('cropScreen');
    document.getElementById('cropContainer').style.display = 'block';
    document.getElementById('cropButton').style.display = 'block';
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


// 先關掉reset function，因為會把前一次的使用紀錄清空
/*
document.getElementById('restartButton').addEventListener('click', function() {
    resetAppState();
    switchScreen('welcomeScreen');
});


function resetAppState() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    const preview = document.getElementById('preview');
    preview.src = '';
    preview.style.display = 'none';
    document.getElementById('cropContainer').style.display = 'none';
    document.getElementById('cropButton').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('analysisResult').style.display = 'none';
    document.getElementById('restartButton').style.display = 'none';
    const video = document.getElementById('video');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    // 清空文件輸入框的值
    const uploadInput = document.getElementById('uploadInput');
    uploadInput.value = '';
}
*/

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
