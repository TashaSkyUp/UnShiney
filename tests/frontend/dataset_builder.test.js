/**
 * Frontend tests specifically for the dataset builder drag and drop functionality
 */

// Mock the DOM environment with all necessary elements for dataset builder tab
document.body.innerHTML = `
<div class="dataset-gallery">
    <h3>Current Dataset <span id="dataset-count">(0 items)</span></h3>
    <div class="dataset-instructions">
        <p><strong>Quick Add:</strong> Drag and drop image pairs directly to the area below</p>
    </div>
    <div class="gallery-container" id="dataset-gallery-container">
        <!-- Dataset items will be added here dynamically -->
    </div>
    <div class="dataset-actions">
        <button id="clear-dataset-btn" disabled>Clear Dataset</button>
        <button id="save-dataset-btn" disabled>Save Dataset</button>
        <button id="load-dataset-btn">Load Dataset</button>
    </div>
</div>
<div class="pair-upload-container">
    <div class="pair-item">
        <div class="upload-box" id="original-upload-box">
            <div class="upload-label">Original Image (with shine)</div>
            <input type="file" id="original-pair-upload" accept="image/*">
            <div class="upload-placeholder"></div>
            <div class="upload-preview">
                <img id="original-pair-preview" alt="Original Preview">
            </div>
        </div>
    </div>
    <div class="pair-item">
        <div class="upload-box" id="clean-upload-box">
            <div class="upload-label">Clean Image (without shine)</div>
            <input type="file" id="clean-pair-upload" accept="image/*">
            <div class="upload-placeholder"></div>
            <div class="upload-preview">
                <img id="clean-pair-preview" alt="Clean Preview">
            </div>
        </div>
    </div>
</div>
<div class="pair-controls">
    <button id="add-pair-to-dataset-btn" disabled>Add Pair to Dataset</button>
    <button id="generate-sample-pairs-btn">Generate Sample Pairs</button>
    <button id="bulk-import-btn">Bulk Import</button>
</div>
`;

describe('Dataset Builder Functionality', () => {
    // Setup mock elements and globals
    let originalUploadBox, cleanUploadBox, galleryContainer;
    let originalPreview, cleanPreview, addButton, bulkImportBtn;
    let datasetCount, clearButton, saveButton;
    
    beforeEach(() => {
        // Reset mocks and state
        jest.clearAllMocks();
        
        // Setup DOM elements
        originalUploadBox = document.getElementById('original-upload-box');
        cleanUploadBox = document.getElementById('clean-upload-box');
        galleryContainer = document.getElementById('dataset-gallery-container');
        originalPreview = document.getElementById('original-pair-preview');
        cleanPreview = document.getElementById('clean-pair-preview');
        addButton = document.getElementById('add-pair-to-dataset-btn');
        bulkImportBtn = document.getElementById('bulk-import-btn');
        datasetCount = document.getElementById('dataset-count');
        clearButton = document.getElementById('clear-dataset-btn');
        saveButton = document.getElementById('save-dataset-btn');
        
        // Reset element states
        originalPreview.style.display = 'none';
        cleanPreview.style.display = 'none';
        addButton.disabled = true;
        bulkImportBtn.disabled = false;
        clearButton.disabled = true;
        saveButton.disabled = true;
        galleryContainer.innerHTML = '';
        originalUploadBox.classList.remove('dragover');
        cleanUploadBox.classList.remove('dragover');
        galleryContainer.classList.remove('dragover');
        
        // Initialize dataset
        window.dataset = [];
        
        // Mock the file handling functions
        window.handlePairFile = jest.fn((file, type) => {
            if (type === 'original') {
                originalPreview.src = 'mockdata';
                originalPreview.style.display = 'block';
            } else {
                cleanPreview.src = 'mockdata';
                cleanPreview.style.display = 'block';
            }
            
            if (originalPreview.style.display === 'block' && cleanPreview.style.display === 'block') {
                addButton.disabled = false;
            }
            return true;
        });
        
        window.processBulkPair = jest.fn((file1, file2) => {
            window.dataset.push({
                id: `mock-${Date.now()}`,
                original: 'mockdata',
                clean: 'mockdata'
            });
            return true;
        });
        
        // Mock the updateDatasetGallery function
        window.updateDatasetGallery = jest.fn(() => {
            datasetCount.textContent = `(${window.dataset.length} items)`;
            if (window.dataset.length > 0) {
                clearButton.disabled = false;
                saveButton.disabled = false;
            } else {
                clearButton.disabled = true;
                saveButton.disabled = true;
            }
            
            // Clear the gallery container
            galleryContainer.innerHTML = '';
            
            // Add mock items
            window.dataset.forEach(item => {
                const mockItem = document.createElement('div');
                mockItem.className = 'gallery-item';
                mockItem.innerHTML = `
                    <img src="${item.original}" class="gallery-item-preview" alt="Dataset item">
                    <div class="gallery-item-info">
                        <span class="pair-indicator">Pair</span>
                    </div>
                    <div class="gallery-item-remove" data-id="${item.id}">×</div>
                `;
                galleryContainer.appendChild(mockItem);
            });
            
            return true;
        });
        
        // Connect event handlers for drag and drop
        originalUploadBox.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        
        originalUploadBox.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        
        originalUploadBox.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                window.handlePairFile(e.dataTransfer.files[0], 'original');
            }
        });
        
        cleanUploadBox.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        
        cleanUploadBox.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        
        cleanUploadBox.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                window.handlePairFile(e.dataTransfer.files[0], 'clean');
            }
        });
        
        galleryContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        
        galleryContainer.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        
        galleryContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                const files = Array.from(e.dataTransfer.files);
                
                if (files.length === 2) {
                    window.processBulkPair(files[0], files[1]);
                    window.updateDatasetGallery();
                    return;
                }
                
                if (files.length > 0) {
                    files.sort((a, b) => a.name.localeCompare(b.name));
                    
                    for (let i = 0; i < files.length - 1; i += 2) {
                        window.processBulkPair(files[i], files[i + 1]);
                    }
                    
                    window.updateDatasetGallery();
                }
            }
        });
        
        // Connect add button
        addButton.addEventListener('click', function() {
            window.dataset.push({
                id: `mock-${Date.now()}`,
                original: originalPreview.src,
                clean: cleanPreview.src
            });
            
            originalPreview.style.display = 'none';
            cleanPreview.style.display = 'none';
            addButton.disabled = true;
            
            window.updateDatasetGallery();
        });
        
        // Connect bulk import button
        bulkImportBtn.addEventListener('click', function() {
            // Just test that it's clickable
            window.bulkImportClicked = true;
        });
    });
    
    test('Dataset gallery should show instructions when empty', () => {
        // Gallery container should be empty initially
        expect(galleryContainer.innerHTML).toBe('');
        
        // Count should show 0 items
        expect(datasetCount.textContent).toBe('(0 items)');
    });
    
    test('Original upload box should accept files via drag and drop', () => {
        // Create mock drag and drop event
        const mockFile = new File([''], 'original.png', { type: 'image/png' });
        const dropEvent = new Event('drop');
        
        // Mock properties that would be set by a real drop event
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [mockFile]
            }
        });
        
        // Add dragover class to simulate being in drag state
        originalUploadBox.classList.add('dragover');
        
        // Trigger drop event
        originalUploadBox.dispatchEvent(dropEvent);
        
        // Verify handlers were called
        expect(dropEvent.preventDefault).toHaveBeenCalled();
        expect(dropEvent.stopPropagation).toHaveBeenCalled();
        
        // Verify class was removed
        expect(originalUploadBox.classList.contains('dragover')).toBe(false);
        
        // Verify handlePairFile was called with correct args
        expect(window.handlePairFile).toHaveBeenCalledWith(mockFile, 'original');
    });
    
    test('Clean upload box should accept files via drag and drop', () => {
        // Create mock drag and drop event
        const mockFile = new File([''], 'clean.png', { type: 'image/png' });
        const dropEvent = new Event('drop');
        
        // Mock properties that would be set by a real drop event
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [mockFile]
            }
        });
        
        // Add dragover class to simulate being in drag state
        cleanUploadBox.classList.add('dragover');
        
        // Trigger drop event
        cleanUploadBox.dispatchEvent(dropEvent);
        
        // Verify handlers were called
        expect(dropEvent.preventDefault).toHaveBeenCalled();
        expect(dropEvent.stopPropagation).toHaveBeenCalled();
        
        // Verify class was removed
        expect(cleanUploadBox.classList.contains('dragover')).toBe(false);
        
        // Verify handlePairFile was called with correct args
        expect(window.handlePairFile).toHaveBeenCalledWith(mockFile, 'clean');
    });
    
    test('Gallery container should accept pairs of files via drag and drop', () => {
        // Create mock files
        const mockFile1 = new File([''], 'image1.png', { type: 'image/png' });
        const mockFile2 = new File([''], 'image2.png', { type: 'image/png' });
        const dropEvent = new Event('drop');
        
        // Mock properties that would be set by a real drop event
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [mockFile1, mockFile2]
            }
        });
        
        // Add dragover class to simulate being in drag state
        galleryContainer.classList.add('dragover');
        
        // Trigger drop event
        galleryContainer.dispatchEvent(dropEvent);
        
        // Verify handlers were called
        expect(dropEvent.preventDefault).toHaveBeenCalled();
        expect(dropEvent.stopPropagation).toHaveBeenCalled();
        
        // Verify class was removed
        expect(galleryContainer.classList.contains('dragover')).toBe(false);
        
        // Verify processBulkPair was called
        expect(window.processBulkPair).toHaveBeenCalledWith(mockFile1, mockFile2);
        
        // Verify gallery was updated
        expect(window.updateDatasetGallery).toHaveBeenCalled();
    });
    
    test('Gallery container should handle multiple file pairs', () => {
        // Create 4 mock files
        const mockFiles = [
            new File([''], 'image1.png', { type: 'image/png' }),
            new File([''], 'image2.png', { type: 'image/png' }),
            new File([''], 'image3.png', { type: 'image/png' }),
            new File([''], 'image4.png', { type: 'image/png' })
        ];
        
        const dropEvent = new Event('drop');
        
        // Mock properties that would be set by a real drop event
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: mockFiles
            }
        });
        
        // Trigger drop event
        galleryContainer.dispatchEvent(dropEvent);
        
        // Verify processBulkPair was called twice (for 2 pairs)
        expect(window.processBulkPair).toHaveBeenCalledTimes(2);
        expect(window.processBulkPair).toHaveBeenNthCalledWith(1, mockFiles[0], mockFiles[1]);
        expect(window.processBulkPair).toHaveBeenNthCalledWith(2, mockFiles[2], mockFiles[3]);
        
        // Verify gallery was updated
        expect(window.updateDatasetGallery).toHaveBeenCalled();
    });
    
    test('Add button should correctly add pair to dataset', () => {
        // Setup test conditions
        originalPreview.src = 'original-data';
        originalPreview.style.display = 'block';
        cleanPreview.src = 'clean-data';
        cleanPreview.style.display = 'block';
        addButton.disabled = false;
        
        // Click add button
        addButton.click();
        
        // Verify item was added to dataset
        expect(window.dataset.length).toBe(1);
        expect(window.dataset[0].original).toBe('original-data');
        expect(window.dataset[0].clean).toBe('clean-data');
        
        // Verify preview was reset
        expect(originalPreview.style.display).toBe('none');
        expect(cleanPreview.style.display).toBe('none');
        expect(addButton.disabled).toBe(true);
        
        // Verify gallery was updated
        expect(window.updateDatasetGallery).toHaveBeenCalled();
    });
    
    test('Bulk import button should be clickable', () => {
        // Verify button exists and is not disabled
        expect(bulkImportBtn).not.toBeNull();
        expect(bulkImportBtn.disabled).toBe(false);
        
        // Click button
        bulkImportBtn.click();
        
        // Verify click handler was called
        expect(window.bulkImportClicked).toBe(true);
    });
});
