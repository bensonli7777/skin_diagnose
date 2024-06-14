document.addEventListener('DOMContentLoaded', function() {
    const screens = document.querySelectorAll('.screen');
    const loginButton = document.getElementById('loginButton');
    const backToWelcomeButtons = document.querySelectorAll('#backToWelcomeButton');
    const registerButton = document.getElementById('registerButton');
    const backToLoginButton = document.getElementById('backToLoginButton');
    const backToRegisterButton = document.getElementById('backToRegisterButton');
    const captureButton = document.getElementById('captureButton');
    const cropButton = document.getElementById('cropButton');
    const restartButton = document.getElementById('restartButton');
    const historybutton = document.getElementById('historybutton');

    const showScreen = (screenId) => {
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

    loginButton.addEventListener('click', () => {
        switchScreen('loginScreen');
    });

    registerButton.addEventListener('click', () => {
        switchScreen('registerScreen');
    });

    backToLoginButton.addEventListener('click', () => {
        switchScreen('loginScreen');
    });

    backToRegisterButton.addEventListener('click', () => {
        switchScreen('registerScreen');
    });
    historybutton.addEventListener('click', () => {
        switchScreen('historyScreen');
    });

    captureButton.addEventListener('click', () => {
        captureImage();
        showScreen('cropScreen');
    });

    cropButton.addEventListener('click', () => {
        cropAndUploadImage();
        showScreen('resultScreen');
    });

    restartButton.addEventListener('click', () => showScreen('welcomeScreen'));

    backToWelcomeButtons.forEach(button => button.addEventListener('click', () => showScreen('welcomeScreen')));

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === '登錄成功') {
                sessionStorage.setItem('username', username);
                showScreen('captureScreen');
                openCamera();
            } else {
                alert('登錄失敗');
            }
        });
    });

    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === '註冊成功') {
                showScreen('loginScreen');
            } else {
                alert('註冊失敗');
            }
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
            video.style.display = 'block';
            captureButton.style.display = 'block';
        })
        .catch(function(error) {
            console.error("獲取攝像頭失敗", error);
        });
    }

    function captureImage() {
        const video = document.getElementById('video');
        if (video && video.srcObject) {
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
            
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(preview, {
                aspectRatio: 1,
                viewMode: 1,
            });
            
            switchScreen('cropScreen');
            document.getElementById('cropContainer').style.display = 'block';
            cropButton.style.display = 'block';
        } else {
            console.error("無法訪問攝像頭");
        }
    }

    function cropAndUploadImage() {
        cropper.getCroppedCanvas().toBlob(function(blob) {
            const formData = new FormData();
            formData.append('image', blob, 'croppedImage.png');
    
            showProgress();
    
            fetch('/upload', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                showResult({
                    status: data.status,
                    disease: data.disease,
                    confidence: data.confidence + '%',
                    imageSrc: URL.createObjectURL(blob)
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
        progressContainer.style.display = 'block';
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(interval);
                progressContainer.style.display = 'none';
            }
        }, 300);
    }

    function showResult(data) {
        switchScreen('resultScreen');
        const croppedImageElement = document.getElementById('croppedImage');
        croppedImageElement.src = data.imageSrc;
    
        const analysisResultElement = document.getElementById('analysisResult');
        analysisResultElement.innerHTML = `
            <p>診斷結果</p>
            <div class="result-conclusion">${data.disease} 概率 ${data.confidence}</div>
        `;
        analysisResultElement.style.display = 'flex';
        restartButton.style.display = 'block';
    }

    historybutton.addEventListener('click', () => {
        const username = sessionStorage.getItem('username');
        if (username) {
            fetch(`/history?username=${username}`)
            .then(response => response.json())
            .then(data => {
                console.log("History data received", data)
                const historyDiv = document.getElementById('history');
                historyDiv.innerHTML = '';
                data.history.forEach(entry => {
                    const photoImg = new Image();
                    photoImg.src = 'data:image/jpeg;base64,' + entry.photo;
                    historyDiv.appendChild(photoImg);
                    const infoDiv = document.createElement('div');
                    infoDiv.innerHTML = `Upload Time: ${entry.upload_time} <br> Diagnosis: ${entry.diagnosis}`;
                    historyDiv.appendChild(infoDiv);
                });
                showScreen('historyScreen');
            })
            .catch(error => console.error('Error:', error));
        } else {
            console.error('No username found in session storage.');
        }
    });
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}