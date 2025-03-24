document.addEventListener('DOMContentLoaded', function() {
    // ------- Tab Navigation ----------
    // Direct tab system implementation without relying on CSS transitions
    function setupTabSystem() {
        // Get all tab links and content divs
        const tabLinks = document.querySelectorAll('.main-nav a');
        const tabContents = document.querySelectorAll('.tab-content');
        
        console.log("Setting up tab system...");
        console.log(`Found ${tabLinks.length} tab links and ${tabContents.length} tab contents`);
        
        if (tabLinks.length === 0) {
            console.error("No tab links found! Check the HTML structure.");
            return;
        }
        
        // Hide all tab contents initially (explicit style, not just classes)
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Setup click handlers
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const tabId = this.getAttribute('data-tab');
                if (!tabId) {
                    console.error("Tab link missing data-tab attribute", this);
                    return;
                }
                
                // Log which tab was clicked
                console.log(`Switching to tab: ${tabId}`);
                
                // Hide all tabs
                tabContents.forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                // Remove active class from all links
                tabLinks.forEach(tabLink => {
                    tabLink.classList.remove('active');
                });
                
                // Show the selected tab
                const selectedTab = document.getElementById(tabId);
                if (selectedTab) {
                    selectedTab.style.display = 'block';
                    selectedTab.classList.add('active');
                    this.classList.add('active');
                } else {
                    console.error(`Tab content with ID "${tabId}" not found`);
                }
            });
        });
        
        // Activate the first tab by default
        console.log("Activating default tab (process-tab)");
        const processTab = document.querySelector('.main-nav a[data-tab="process-tab"]');
        if (processTab) {
            processTab.click();
        } else {
            console.warn("Process tab not found, clicking first tab instead");
            tabLinks[0].click();
        }
    }
    
    // ------- Process Tab Elements ----------
    const uploadArea = document.getElementById('upload-area');
    const uploadInput = document.getElementById('image-upload');
    const previewArea = document.getElementById('preview-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewImage = document.getElementById('preview-image');
    const processBtn = document.getElementById('process-btn');
    const resultsSection = document.getElementById('results-section');
    const originalImage = document.getElementById('original-image');
    const processedImage = document.getElementById('processed-image');
    const modelSelect = document.getElementById('model-select');
    
    // ------- Dataset Tab Elements ----------
    const pairUploadSection = document.getElementById('pair-upload');
    const originalPairUpload = document.getElementById('original-pair-upload');
    const cleanPairUpload = document.getElementById('clean-pair-upload');
    const originalPairPreview = document.getElementById('original-pair-preview');
    const cleanPairPreview = document.getElementById('clean-pair-preview');
    const addPairToDatasetBtn = document.getElementById('add-pair-to-dataset-btn');
    const datasetGalleryContainer = document.getElementById('dataset-gallery-container');
    const datasetCount = document.getElementById('dataset-count');
    const clearDatasetBtn = document.getElementById('clear-dataset-btn');
    const saveDatasetBtn = document.getElementById('save-dataset-btn');
    const loadDatasetBtn = document.getElementById('load-dataset-btn');
    
    // ------- Model Builder Elements ----------
    const denseModelBtn = document.getElementById('dense-model-btn');
    const convModelBtn = document.getElementById('conv-model-btn');
    const hybridModelBtn = document.getElementById('hybrid-model-btn');
    const customModelBtn = document.getElementById('custom-model-btn');
    const architectureVis = document.getElementById('architecture-vis');
    const addLayerBtn = document.getElementById('add-layer-btn');
    const layerTypeSelect = document.getElementById('layer-type-select');
    const layersContainer = document.getElementById('layers-container');
    const learningRateInput = document.getElementById('learning-rate');
    const batchSizeInput = document.getElementById('batch-size');
    const epochsInput = document.getElementById('epochs');
    const validationSplitInput = document.getElementById('validation-split');
    const optimizerSelect = document.getElementById('optimizer-select');
    const lossFunctionSelect = document.getElementById('loss-function');
    const saveModelConfigBtn = document.getElementById('save-model-config-btn');
    const loadModelConfigBtn = document.getElementById('load-model-config-btn');
    const trainModelBtn = document.getElementById('train-model-btn');
    const advancedTrainingStatus = document.getElementById('advanced-training-status');
    const currentEpochSpan = document.getElementById('current-epoch');
    const totalEpochsSpan = document.getElementById('total-epochs');
    const currentLossSpan = document.getElementById('current-loss');
    const currentValLossSpan = document.getElementById('current-val-loss');
    const advancedProgressBar = document.getElementById('advanced-progress-bar');
    const lossChart = document.getElementById('loss-chart');
    
    // ------- Modal Elements ----------
    const saveConfigModal = document.getElementById('save-config-modal');
    const closeModal = document.querySelector('.close-modal');
    const configNameInput = document.getElementById('config-name');
    const configDescriptionInput = document.getElementById('config-description');
    const confirmSaveConfigBtn = document.getElementById('confirm-save-config');
    
    // ------- Global Variables ----------
    let dataset = [];
    let chart = null;
    let currentModelType = 'dense';
    let modelLayers = [];
    let trainingInterval = null;
    
    // ------- Process Tab Functions ----------
    
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
    
    // Model selection change
    modelSelect.addEventListener('change', function() {
        // In a real app, this would load a model configuration
        console.log('Selected model:', this.value);
    });
    
    // Process image
    processBtn.addEventListener('click', function() {
        if (!uploadInput.files || !uploadInput.files[0]) {
            alert('Please select an image first');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', uploadInput.files[0]);
        formData.append('model_type', currentModelType); // Use current model type from Model Builder
        
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
    
    // ------- Dataset Tab Functions ----------
    
    // Setup dataset section
    console.log("Initializing dataset section...");
    
    // Variables for image pair handling
    let originalPairImage = null;
    let cleanPairImage = null;
    const generateSamplePairsBtn = document.getElementById('generate-sample-pairs-btn');
    
    // Image pair uploads
    originalPairUpload.addEventListener('change', function() {
        if (this.files && this.files.length) {
            const reader = new FileReader();
            reader.onload = function(e) {
                originalPairPreview.src = e.target.result;
                originalPairPreview.style.display = 'block';
                checkPairUploads();
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    cleanPairUpload.addEventListener('change', function() {
        if (this.files && this.files.length) {
            const reader = new FileReader();
            reader.onload = function(e) {
                cleanPairPreview.src = e.target.result;
                cleanPairPreview.style.display = 'block';
                checkPairUploads();
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    function checkPairUploads() {
        if (originalPairPreview.style.display === 'block' && cleanPairPreview.style.display === 'block') {
            addPairToDatasetBtn.disabled = false;
        }
    }
    
    // Add pair to dataset
    addPairToDatasetBtn.addEventListener('click', function() {
        addToDataset(originalPairPreview.src, cleanPairPreview.src);
        
        // Reset uploads
        originalPairPreview.src = '';
        cleanPairPreview.src = '';
        originalPairPreview.style.display = 'none';
        cleanPairPreview.style.display = 'none';
        originalPairUpload.value = '';
        cleanPairUpload.value = '';
        addPairToDatasetBtn.disabled = true;
    });
    
    // Add to dataset
    function addToDataset(original, clean, isSample = false) {
        // Create unique ID using timestamp and random number to ensure uniqueness
        const itemId = Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        dataset.push({
            original: original,
            clean: clean,
            id: itemId,
            isSample: isSample
        });
        
        updateDatasetGallery();
        
        // Enable dataset action buttons once we have data
        if (dataset.length > 0) {
            clearDatasetBtn.disabled = false;
            saveDatasetBtn.disabled = false;
        }
    }
    
    // Update dataset gallery
    function updateDatasetGallery() {
        datasetGalleryContainer.innerHTML = '';
        datasetCount.textContent = `(${dataset.length} items)`;
        
        if (dataset.length > 0) {
            clearDatasetBtn.disabled = false;
            saveDatasetBtn.disabled = false;
        } else {
            clearDatasetBtn.disabled = true;
            saveDatasetBtn.disabled = true;
        }
        
        // If dataset is empty, show a message
        if (dataset.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-dataset-message';
            emptyMessage.innerHTML = `
                <p>Your dataset is empty. Upload image pairs or generate sample data.</p>
            `;
            datasetGalleryContainer.appendChild(emptyMessage);
            return;
        }
        
        // Otherwise, show the dataset items
        dataset.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            // Determine if we should show full image or placeholder for samples
            let imgContent;
            if (item.isSample) {
                // For sample images, show a placeholder instead of the actual base64 data
                imgContent = `
                    <div class="sample-image-placeholder">
                        <span class="sample-badge">Sample</span>
                        <span class="sample-icon">📷</span>
                    </div>
                `;
            } else {
                // For user-uploaded images, show the actual image preview
                imgContent = `<img src="${item.original}" class="gallery-item-preview" alt="Dataset item">`;
            }
            
            galleryItem.innerHTML = `
                ${imgContent}
                <div class="gallery-item-info">
                    <span class="pair-indicator">Pair #${dataset.indexOf(item) + 1}</span>
                    ${item.isSample ? '<span class="sample-indicator">Sample Data</span>' : ''}
                </div>
                <div class="gallery-item-remove" data-id="${item.id}">×</div>
            `;
            datasetGalleryContainer.appendChild(galleryItem);
            
            // Add remove event
            galleryItem.querySelector('.gallery-item-remove').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                dataset = dataset.filter(item => item.id !== id);
                updateDatasetGallery();
            });
            
            // Add click to view details (in the future this could show a modal with before/after)
            galleryItem.addEventListener('click', function(e) {
                // Don't trigger if clicking the remove button
                if (e.target.classList.contains('gallery-item-remove')) return;
                
                // Here we could show a modal with the image pair details
                console.log('View details for item:', item.id);
                // For now just log it, but in a full implementation this would show a modal
            });
        });
    }
    
    // Clear dataset
    clearDatasetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the entire dataset?')) {
            dataset = [];
            updateDatasetGallery();
        }
    });
    
    // Save dataset
    saveDatasetBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(dataset);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', 'unshine_dataset.json');
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
    });
    
    // Load dataset
    loadDatasetBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const loadedDataset = JSON.parse(e.target.result);
                    if (Array.isArray(loadedDataset)) {
                        dataset = loadedDataset;
                        updateDatasetGallery();
                    }
                } catch (error) {
                    alert('Invalid dataset file');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    // ------- Model Builder Functions ----------
    
    // Model type selection
    denseModelBtn.addEventListener('click', function() {
        setModelType('dense');
    });
    
    convModelBtn.addEventListener('click', function() {
        setModelType('conv');
    });
    
    hybridModelBtn.addEventListener('click', function() {
        setModelType('hybrid');
    });
    
    customModelBtn.addEventListener('click', function() {
        setModelType('custom');
    });
    
    function setModelType(type) {
        currentModelType = type;
        
        // Update button states
        [denseModelBtn, convModelBtn, hybridModelBtn, customModelBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${type}-model-btn`).classList.add('active');
        
        // Create preset model architecture
        modelLayers = [];
        
        switch(type) {
            case 'dense':
                modelLayers = [
                    { type: 'flatten', name: 'Flatten' },
                    { type: 'dense', name: 'Dense', units: 128, activation: 'relu' },
                    { type: 'dense', name: 'Dense', units: 256, activation: 'relu' },
                    { type: 'dense', name: 'Dense', units: 128, activation: 'relu' },
                    { type: 'dense', name: 'Output', units: 4096, activation: 'sigmoid' }
                ];
                break;
            case 'conv':
                modelLayers = [
                    { type: 'conv2d', name: 'Conv2D', filters: 16, kernel_size: 3, activation: 'relu' },
                    { type: 'maxpool', name: 'MaxPool', pool_size: 2 },
                    { type: 'conv2d', name: 'Conv2D', filters: 32, kernel_size: 3, activation: 'relu' },
                    { type: 'maxpool', name: 'MaxPool', pool_size: 2 },
                    { type: 'flatten', name: 'Flatten' },
                    { type: 'dense', name: 'Dense', units: 128, activation: 'relu' },
                    { type: 'dense', name: 'Output', units: 4096, activation: 'sigmoid' }
                ];
                break;
            case 'hybrid':
                modelLayers = [
                    { type: 'conv2d', name: 'Conv2D', filters: 16, kernel_size: 3, activation: 'relu' },
                    { type: 'conv2d', name: 'Conv2D', filters: 32, kernel_size: 3, activation: 'relu' },
                    { type: 'flatten', name: 'Flatten' },
                    { type: 'dense', name: 'Dense', units: 256, activation: 'relu' },
                    { type: 'dense', name: 'Dense', units: 128, activation: 'relu' },
                    { type: 'dense', name: 'Output', units: 4096, activation: 'sigmoid' }
                ];
                break;
            case 'custom':
                modelLayers = [
                    { type: 'flatten', name: 'Flatten' },
                    { type: 'dense', name: 'Dense', units: 64, activation: 'relu' },
                    { type: 'dense', name: 'Output', units: 4096, activation: 'sigmoid' }
                ];
                break;
        }
        
        updateArchitectureVisualization();
        generateLayerConfigs();
    }
    
    // Update architecture visualization
    function updateArchitectureVisualization() {
        architectureVis.innerHTML = '';
        
        modelLayers.forEach((layer, index) => {
            const layerBox = document.createElement('div');
            layerBox.className = 'layer-box';
            
            let layerText = layer.name;
            if (layer.type === 'dense') {
                layerText += ` (${layer.units})`;
            } else if (layer.type === 'conv2d') {
                layerText += ` (${layer.filters}×${layer.kernel_size}×${layer.kernel_size})`;
            }
            
            layerBox.textContent = layerText;
            architectureVis.appendChild(layerBox);
        });
    }
    
    // Generate layer configuration UI
    function generateLayerConfigs() {
        layersContainer.innerHTML = '';
        
        modelLayers.forEach((layer, index) => {
            const layerConfig = document.createElement('div');
            layerConfig.className = 'layer-config';
            layerConfig.dataset.index = index;
            
            let configHTML = `
                <div class="layer-config-header">
                    <h4>${layer.name} (${layer.type})</h4>
                    <div class="remove-layer" data-index="${index}">×</div>
                </div>
                <div class="layer-params">
            `;
            
            // Different params based on layer type
            if (layer.type === 'dense') {
                configHTML += `
                    <div class="param-input">
                        <label for="units-${index}">Units:</label>
                        <input type="number" id="units-${index}" value="${layer.units}" min="1" max="4096">
                    </div>
                    <div class="param-input">
                        <label for="activation-${index}">Activation:</label>
                        <select id="activation-${index}">
                            <option value="relu" ${layer.activation === 'relu' ? 'selected' : ''}>ReLU</option>
                            <option value="sigmoid" ${layer.activation === 'sigmoid' ? 'selected' : ''}>Sigmoid</option>
                            <option value="tanh" ${layer.activation === 'tanh' ? 'selected' : ''}>Tanh</option>
                            <option value="selu" ${layer.activation === 'selu' ? 'selected' : ''}>SELU</option>
                        </select>
                    </div>
                `;
            } else if (layer.type === 'conv2d') {
                configHTML += `
                    <div class="param-input">
                        <label for="filters-${index}">Filters:</label>
                        <input type="number" id="filters-${index}" value="${layer.filters}" min="1" max="256">
                    </div>
                    <div class="param-input">
                        <label for="kernel-${index}">Kernel Size:</label>
                        <input type="number" id="kernel-${index}" value="${layer.kernel_size}" min="1" max="7">
                    </div>
                    <div class="param-input">
                        <label for="activation-${index}">Activation:</label>
                        <select id="activation-${index}">
                            <option value="relu" ${layer.activation === 'relu' ? 'selected' : ''}>ReLU</option>
                            <option value="sigmoid" ${layer.activation === 'sigmoid' ? 'selected' : ''}>Sigmoid</option>
                            <option value="tanh" ${layer.activation === 'tanh' ? 'selected' : ''}>Tanh</option>
                        </select>
                    </div>
                `;
            } else if (layer.type === 'maxpool') {
                configHTML += `
                    <div class="param-input">
                        <label for="pool-size-${index}">Pool Size:</label>
                        <input type="number" id="pool-size-${index}" value="${layer.pool_size}" min="1" max="4">
                    </div>
                `;
            } else if (layer.type === 'dropout') {
                configHTML += `
                    <div class="param-input">
                        <label for="rate-${index}">Dropout Rate:</label>
                        <input type="number" id="rate-${index}" value="${layer.rate || 0.5}" min="0.1" max="0.9" step="0.1">
                    </div>
                `;
            }
            
            configHTML += `
                </div>
            `;
            
            layerConfig.innerHTML = configHTML;
            layersContainer.appendChild(layerConfig);
            
            // Add event listener to remove button
            layerConfig.querySelector('.remove-layer').addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                modelLayers.splice(index, 1);
                updateArchitectureVisualization();
                generateLayerConfigs();
            });
            
            // Add event listeners to parameter inputs
            const inputs = layerConfig.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', function() {
                    updateLayerParams(index);
                });
            });
        });
    }
    
    // Update layer parameters from UI
    function updateLayerParams(index) {
        const layer = modelLayers[index];
        const layerConfig = document.querySelector(`.layer-config[data-index="${index}"]`);
        
        if (layer.type === 'dense') {
            layer.units = parseInt(layerConfig.querySelector(`#units-${index}`).value);
            layer.activation = layerConfig.querySelector(`#activation-${index}`).value;
        } else if (layer.type === 'conv2d') {
            layer.filters = parseInt(layerConfig.querySelector(`#filters-${index}`).value);
            layer.kernel_size = parseInt(layerConfig.querySelector(`#kernel-${index}`).value);
            layer.activation = layerConfig.querySelector(`#activation-${index}`).value;
        } else if (layer.type === 'maxpool') {
            layer.pool_size = parseInt(layerConfig.querySelector(`#pool-size-${index}`).value);
        } else if (layer.type === 'dropout') {
            layer.rate = parseFloat(layerConfig.querySelector(`#rate-${index}`).value);
        }
        
        updateArchitectureVisualization();
    }
    
    // Add layer
    addLayerBtn.addEventListener('click', function() {
        const layerType = layerTypeSelect.value;
        let newLayer = {};
        
        switch(layerType) {
            case 'dense':
                newLayer = { type: 'dense', name: 'Dense', units: 64, activation: 'relu' };
                break;
            case 'conv2d':
                newLayer = { type: 'conv2d', name: 'Conv2D', filters: 16, kernel_size: 3, activation: 'relu' };
                break;
            case 'maxpool':
                newLayer = { type: 'maxpool', name: 'MaxPool', pool_size: 2 };
                break;
            case 'dropout':
                newLayer = { type: 'dropout', name: 'Dropout', rate: 0.5 };
                break;
            case 'flatten':
                newLayer = { type: 'flatten', name: 'Flatten' };
                break;
        }
        
        // Add before the output layer if it exists
        const outputLayerIndex = modelLayers.findIndex(layer => layer.name === 'Output');
        if (outputLayerIndex !== -1) {
            modelLayers.splice(outputLayerIndex, 0, newLayer);
        } else {
            modelLayers.push(newLayer);
        }
        
        updateArchitectureVisualization();
        generateLayerConfigs();
    });
    
    // Save model configuration
    saveModelConfigBtn.addEventListener('click', function() {
        saveConfigModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        saveConfigModal.style.display = 'none';
    });
    
    confirmSaveConfigBtn.addEventListener('click', function() {
        const configName = configNameInput.value || 'UnShiney Model';
        const configDescription = configDescriptionInput.value || '';
        
        const modelConfig = {
            name: configName,
            description: configDescription,
            type: currentModelType,
            layers: modelLayers,
            params: {
                learning_rate: parseFloat(learningRateInput.value),
                batch_size: parseInt(batchSizeInput.value),
                epochs: parseInt(epochsInput.value),
                validation_split: parseFloat(validationSplitInput.value),
                optimizer: optimizerSelect.value,
                loss: lossFunctionSelect.value
            }
        };
        
        // Save to local storage
        const configs = JSON.parse(localStorage.getItem('unshineModelConfigs') || '[]');
        configs.push(modelConfig);
        localStorage.setItem('unshineModelConfigs', JSON.stringify(configs));
        
        // Save to file
        const dataStr = JSON.stringify(modelConfig);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `${configName.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(exportLink);
        exportLink.click();
        document.body.removeChild(exportLink);
        
        // Close modal
        saveConfigModal.style.display = 'none';
        configNameInput.value = '';
        configDescriptionInput.value = '';
    });
    
    // Load model configuration
    loadModelConfigBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    if (config.layers && config.params) {
                        // Set model type
                        setModelType(config.type || 'custom');
                        
                        // Load layers
                        modelLayers = config.layers;
                        
                        // Load params
                        learningRateInput.value = config.params.learning_rate || 0.00025;
                        batchSizeInput.value = config.params.batch_size || 32;
                        epochsInput.value = config.params.epochs || 10;
                        validationSplitInput.value = config.params.validation_split || 0.2;
                        optimizerSelect.value = config.params.optimizer || 'adam';
                        lossFunctionSelect.value = config.params.loss || 'mae';
                        
                        updateArchitectureVisualization();
                        generateLayerConfigs();
                    } else {
                        throw new Error('Invalid configuration file');
                    }
                } catch (error) {
                    alert('Invalid configuration file: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    // Train model
    trainModelBtn.addEventListener('click', function() {
        // In a real app, this would send the model configuration and dataset to the server
        advancedTrainingStatus.hidden = false;
        trainModelBtn.disabled = true;
        
        // Show total epochs
        const totalEpochs = parseInt(epochsInput.value);
        totalEpochsSpan.textContent = totalEpochs;
        
        // Initialize chart
        if (chart) {
            chart.destroy();
        }
        
        const ctx = lossChart.getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Training Loss',
                        data: [],
                        borderColor: '#3498db',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Validation Loss',
                        data: [],
                        borderColor: '#e74c3c',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Simulate training
        let currentEpoch = 0;
        let trainingLoss = 0.5;
        let valLoss = 0.6;
        
        trainingInterval = setInterval(() => {
            currentEpoch++;
            currentEpochSpan.textContent = currentEpoch;
            
            // Simulate decreasing loss
            trainingLoss = Math.max(0.05, trainingLoss - 0.05 * Math.random());
            valLoss = Math.max(0.1, valLoss - 0.04 * Math.random());
            
            currentLossSpan.textContent = trainingLoss.toFixed(4);
            currentValLossSpan.textContent = valLoss.toFixed(4);
            
            // Update progress bar
            const progress = (currentEpoch / totalEpochs) * 100;
            advancedProgressBar.style.width = `${progress}%`;
            
            // Update chart
            chart.data.labels.push(`Epoch ${currentEpoch}`);
            chart.data.datasets[0].data.push(trainingLoss);
            chart.data.datasets[1].data.push(valLoss);
            chart.update();
            
            if (currentEpoch >= totalEpochs) {
                clearInterval(trainingInterval);
                
                // Complete training
                setTimeout(() => {
                    alert('Training complete! The model is now ready to process images.');
                    trainModelBtn.disabled = false;
                }, 1000);
            }
        }, 500);
    });
    
    // Generate sample pairs
    generateSamplePairsBtn.addEventListener('click', function() {
        // Show loading state
        generateSamplePairsBtn.disabled = true;
        generateSamplePairsBtn.textContent = 'Generating...';
        
        // Call backend to generate synthetic dataset
        fetch('/generate_synthetic_dataset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
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
            
            // Fetch the generated dataset
            fetch(`/datasets/${data.id}`, {
                method: 'GET'
            })
            .then(response => response.json())
            .then(dataset => {
                // Load the first item as an example
                if (dataset.item_count > 0) {
                    // Get the full dataset to avoid truncated base64 data
                    // In a real implementation, we would load individual items as needed
                    const firstPair = dataset.preview[0];
                    
                    // Load each sample pair
                    for (let i = 0; i < Math.min(dataset.preview.length, 5); i++) {
                        addToDataset(
                            dataset.preview[i].original.substring(0, 100) + '...',
                            dataset.preview[i].clean.substring(0, 100) + '...',
                            true // is from sample
                        );
                    }
                    
                    // Display success message
                    alert(`Successfully generated ${dataset.item_count} sample pairs and added to dataset!`);
                }
            })
            .catch(error => {
                console.error('Error fetching generated dataset:', error);
                alert('Error loading generated samples. Please try again.');
            });
            
            // Reset button
            generateSamplePairsBtn.disabled = false;
            generateSamplePairsBtn.textContent = 'Generate Sample Pairs';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while generating samples: ' + error.message);
            generateSamplePairsBtn.disabled = false;
            generateSamplePairsBtn.textContent = 'Generate Sample Pairs';
        });
    });
    
    // ------- Initialization ----------
    
    // Initialize tabs with direct DOM manipulation
    setupTabSystem();
    
    // Initialize model type
    setModelType('dense');
    
    // Update UI components
    updateDatasetGallery();
    
    // Show a welcome message
    console.log("UnShiney Web Demo initialized successfully!");
    console.log("Upload an image pair or generate sample data to get started with training your model.");
});
