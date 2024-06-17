document.addEventListener('DOMContentLoaded', function() {
    const screens = document.querySelectorAll('.screen');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const enterButton = document.getElementById('enterbutton');
    const backToresultButton = document.querySelectorAll('#backToresultButton');
    const backToLoginButton = document.getElementById('backToLoginButton');
    const backToRegisterButton = document.getElementById('backToRegisterButton');
    const captureButton = document.getElementById('captureButton');
    const cropButton = document.getElementById('cropButton');
    const restartButton = document.getElementById('restartButton');
    const historyButton = document.getElementById('historybutton');
    const uploadButton = document.getElementById('uploadButton');
    const uploadInput = document.getElementById('uploadInput');
    const backToWelcomeButtont = document.getElementById('backToWelcomeButton');
    const logoutButton = document.getElementById('logoutButton');
    const diseaseInfoButton = document.getElementById('diseaseInfoButton');
    let cropper;

    const showScreen = (screenId) => {
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

    loginButton.addEventListener('click', () => showScreen('loginScreen'));
    backToWelcomeButtont.addEventListener('click', () => showScreen('welcomeScreen'));
    registerButton.addEventListener('click', () => showScreen('registerScreen'));
    backToLoginButton.addEventListener('click', () => showScreen('loginScreen'));
    backToRegisterButton.addEventListener('click', () => showScreen('registerScreen'));
    diseaseInfoButton.addEventListener('click', () => showScreen('diseaseInfoScreen'));
    backToresultButton.forEach(button => button.addEventListener('click', () => showScreen('resultScreen')));

    restartButton.addEventListener('click', () => {
        showScreen('captureScreen');
        openCamera();
    });
    backToresultButton.forEach(button => button.addEventListener('click', () => showScreen('resultScreen')));
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('username');
        showScreen('welcomeScreen');
    });

    captureButton.addEventListener('click', captureImage);
    cropButton.addEventListener('click', cropAndUploadImage);
    uploadButton.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', uploadImage);
    historyButton.addEventListener('click', fetchHistory);
   

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        loginUser(username, password);
    });


    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        registerUser(username, password);
    });

    function openCamera() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
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
            initializeCropper(imageDataUrl);
        } else {
            console.error("無法訪問攝像頭");
        }
    }

    function uploadImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                initializeCropper(e.target.result);
            }
            reader.readAsDataURL(file);
        }
    }

    function initializeCropper(imageDataUrl) {
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

        showScreen('cropScreen');
        document.getElementById('cropContainer').style.display = 'block';
        cropButton.style.display = 'block';
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

    function navigateToDiseaseInfo(disease) {
        window.location.href = `/disease/${disease}`;
    }

    function showResult(data) {
        showScreen('resultScreen');
        const croppedImageElement = document.getElementById('croppedImage');
        croppedImageElement.src = data.imageSrc;

        const analysisResultElement = document.getElementById('analysisResult');
        analysisResultElement.innerHTML = `
            <p>診斷結果</p>
            <div class="result-conclusion">${data.disease} 概率 ${data.confidence}</div>
        `;
        analysisResultElement.style.display = 'flex';
        const diseaseInfoButton = document.getElementById('diseaseInfoButton');
        diseaseInfoButton.style.display = 'block';

        diseaseInfoButton.onclick = function() {
        navigateToDiseaseInfo(data.disease);
    };
        restartButton.style.display = 'block';
    }

    function fetchHistory() {
        const username = sessionStorage.getItem('username');
        if (username) {
            document.getElementById('usernameDisplay').innerText = `${username}`;
            
            fetch(`/history?username=${username}`)
            .then(response => response.json())
            .then(data => {
                const historyDiv = document.getElementById('history');
                historyDiv.innerHTML = '';
                data.history.forEach(entry => {
                    const entryDiv = document.createElement('div');
                    entryDiv.classList.add('history-entry');
                    
                    const photoImg = new Image();
                    photoImg.src = 'data:image/jpeg;base64,' + entry.photo;
                    photoImg.classList.add('history-photo');
                    entryDiv.appendChild(photoImg);
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.classList.add('history-info');
                    infoDiv.innerHTML = `Upload Time: ${entry.upload_time} <br> Diagnosis: ${entry.diagnosis}`;
                    entryDiv.appendChild(infoDiv);
                    
                    historyDiv.appendChild(entryDiv);
                });
                showScreen('historyScreen');
            })
            .catch(error => console.error('Error:', error));
        } else {
            console.error('No username found in session storage.');
        }
    }
    

    function loginUser(username, password) {
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === '登入成功') {
                sessionStorage.setItem('username', username);
                showScreen('captureScreen');
                openCamera();
            } else {
                alert('登入失敗');
            }
        });

    }

    function registerUser(username, password) {
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
    }
});

