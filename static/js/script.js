document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadArea = document.getElementById('upload-area');
    const uploadInput = document.getElementById('image-upload');
    const previewArea = document.getElementById('preview-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewImage = document.getElementById('preview-image');
    const processBtn = document.getElementById('process-btn');
    const resultsSection = document.getElementById('results-section');
    const originalImage = document.getElementById('original-image');
    const processedImage = document.getElementById('processed-image');
    const modelType = document.getElementById('model-type');
    const trainBtn = document.getElementById('train-btn');
    const trainingStatus = document.getElementById('training-status');
    const progressBar = document.getElementById('progress-bar');
    
    // File upload handling - both click and drag-and-drop
    uploadArea.addEventListener('click', function(e) {
        // Only trigger input click if the click was on the upload area itself,
        // not on an already previewed image
        if (previewArea.hidden || e.target === uploadArea) {
            uploadInput.click();
        }
    });
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    // File input change event
    uploadInput.addEventListener('change', function(e) {
        e.stopPropagation();
        if (this.files && this.files.length) {
            handleFile(this.files[0]);
        }
    });
    
    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadPlaceholder.hidden = true;
            previewArea.hidden = false;
            processBtn.disabled = false;
            
            // Store original image for comparison
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Process image
    processBtn.addEventListener('click', function() {
        if (!uploadInput.files || !uploadInput.files[0]) {
            alert('Please select an image first');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', uploadInput.files[0]);
        formData.append('model_type', modelType.value);
        
        // Show loading state
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';
        
        fetch('/process', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Display results
            processedImage.src = data.processed_image;
            resultsSection.hidden = false;
            
            // Reset button
            processBtn.disabled = false;
            processBtn.textContent = 'Process Image';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while processing the image: ' + error.message);
            processBtn.disabled = false;
            processBtn.textContent = 'Process Image';
        });
    });
    
    // Train model
    trainBtn.addEventListener('click', function() {
        trainBtn.disabled = true;
        trainingStatus.hidden = false;
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                completeTraining();
            }
        }, 200);
        
        // Simulate training
        fetch('/train', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model_type: modelType.value })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Let the animation complete
        })
        .catch(error => {
            console.error('Error:', error);
            clearInterval(interval);
            trainingStatus.innerHTML = '<p>Error training model: ' + error.message + '</p>';
            trainBtn.disabled = false;
        });
    });
    
    function completeTraining() {
        trainingStatus.innerHTML = '<p>Training complete! Model ready to use.</p>';
        setTimeout(() => {
            trainingStatus.hidden = true;
            trainBtn.disabled = false;
        }, 3000);
    }
    
    // Debug info for file input
    console.log('Input element:', uploadInput);
    console.log('Is hidden:', uploadInput.hidden);
    console.log('Position:', uploadInput.getBoundingClientRect());
});
