/**
 * Frontend tests for the drag and drop functionality
 * To run these tests, you'll need to install Jest and related dependencies:
 * npm install --save-dev jest @testing-library/dom @testing-library/jest-dom
 */

// Mock the DOM environment
document.body.innerHTML = `
<div class="upload-box" id="original-upload-box">
    <div class="upload-label">Original Image (with shine)</div>
    <input type="file" id="original-pair-upload" accept="image/*">
    <div class="upload-placeholder"></div>
    <div class="upload-preview">
        <img id="original-pair-preview" alt="Original Preview">
    </div>
</div>
<div class="upload-box" id="clean-upload-box">
    <div class="upload-label">Clean Image (without shine)</div>
    <input type="file" id="clean-pair-upload" accept="image/*">
    <div class="upload-placeholder"></div>
    <div class="upload-preview">
        <img id="clean-pair-preview" alt="Clean Preview">
    </div>
</div>
<div class="gallery-container" id="dataset-gallery-container"></div>
<button id="add-pair-to-dataset-btn" disabled>Add Pair to Dataset</button>
<button id="bulk-import-btn">Bulk Import</button>
`;

// Mock FileReader
class MockFileReader {
    constructor() {
        this.result = 'data:image/png;base64,mockdata';
    }
    
    readAsDataURL() {
        setTimeout(() => {
            this.onload({ target: { result: this.result } });
        }, 0);
    }
}

// Mock elements and globals
global.FileReader = MockFileReader;
global.alert = jest.fn();

describe('Drag and Drop Functionality', () => {
    let originalUploadBox, cleanUploadBox, galleryContainer;
    let originalPreview, cleanPreview, addButton, bulkImportBtn;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup DOM elements
        originalUploadBox = document.getElementById('original-upload-box');
        cleanUploadBox = document.getElementById('clean-upload-box');
        galleryContainer = document.getElementById('dataset-gallery-container');
        originalPreview = document.getElementById('original-pair-preview');
        cleanPreview = document.getElementById('clean-pair-preview');
        addButton = document.getElementById('add-pair-to-dataset-btn');
        bulkImportBtn = document.getElementById('bulk-import-btn');
        
        // Reset element states
        originalPreview.style.display = 'none';
        cleanPreview.style.display = 'none';
        addButton.disabled = true;
        galleryContainer.innerHTML = '';
        originalUploadBox.classList.remove('dragover');
        cleanUploadBox.classList.remove('dragover');
        
        // Initialize dataset
        window.dataset = [];
        
        // Setup mock functions
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
        });
        
        window.processBulkPair = jest.fn((file1, file2) => {
            window.dataset.push({
                id: `mock-${Date.now()}`,
                original: 'mockdata',
                clean: 'mockdata'
            });
        });
        
        window.addToDataset = jest.fn(() => {
            window.dataset.push({
                id: `mock-${Date.now()}`,
                original: originalPreview.src,
                clean: cleanPreview.src
            });
            
            originalPreview.style.display = 'none';
            cleanPreview.style.display = 'none';
            addButton.disabled = true;
        });
    });
    
    test('Original upload box should add dragover class on dragover', () => {
        const dragOverEvent = new Event('dragover');
        Object.defineProperty(dragOverEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dragOverEvent, 'stopPropagation', { value: jest.fn() });
        
        originalUploadBox.dispatchEvent(dragOverEvent);
        
        expect(dragOverEvent.preventDefault).toHaveBeenCalled();
        expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
        expect(originalUploadBox.classList.contains('dragover')).toBe(true);
    });
    
    test('Original upload box should remove dragover class on dragleave', () => {
        originalUploadBox.classList.add('dragover');
        
        const dragLeaveEvent = new Event('dragleave');
        Object.defineProperty(dragLeaveEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dragLeaveEvent, 'stopPropagation', { value: jest.fn() });
        
        originalUploadBox.dispatchEvent(dragLeaveEvent);
        
        expect(dragLeaveEvent.preventDefault).toHaveBeenCalled();
        expect(dragLeaveEvent.stopPropagation).toHaveBeenCalled();
        expect(originalUploadBox.classList.contains('dragover')).toBe(false);
    });
    
    test('Original upload box should handle file on drop', () => {
        const dropEvent = new Event('drop');
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        
        const mockFile = new File([''], 'test.png', { type: 'image/png' });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [mockFile]
            }
        });
        
        originalUploadBox.classList.add('dragover');
        originalUploadBox.dispatchEvent(dropEvent);
        
        expect(dropEvent.preventDefault).toHaveBeenCalled();
        expect(dropEvent.stopPropagation).toHaveBeenCalled();
        expect(originalUploadBox.classList.contains('dragover')).toBe(false);
        expect(window.handlePairFile).toHaveBeenCalledWith(mockFile, 'original');
    });
    
    test('Gallery container should process multiple files on drop', () => {
        const dropEvent = new Event('drop');
        Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
        
        const mockFile1 = new File([''], 'test1.png', { type: 'image/png' });
        const mockFile2 = new File([''], 'test2.png', { type: 'image/png' });
        const mockFile3 = new File([''], 'test3.png', { type: 'image/png' });
        const mockFile4 = new File([''], 'test4.png', { type: 'image/png' });
        
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                files: [mockFile1, mockFile2, mockFile3, mockFile4]
            }
        });
        
        galleryContainer.classList.add('dragover');
        galleryContainer.dispatchEvent(dropEvent);
        
        expect(dropEvent.preventDefault).toHaveBeenCalled();
        expect(dropEvent.stopPropagation).toHaveBeenCalled();
        expect(galleryContainer.classList.contains('dragover')).toBe(false);
        
        // Should have processed 2 pairs
        expect(window.processBulkPair).toHaveBeenCalledTimes(2);
        expect(window.processBulkPair).toHaveBeenNthCalledWith(1, mockFile1, mockFile2);
        expect(window.processBulkPair).toHaveBeenNthCalledWith(2, mockFile3, mockFile4);
    });
    
    test('Add button should add pair to dataset when clicked', () => {
        // Setup test preconditions
        originalPreview.src = 'mockdata1';
        originalPreview.style.display = 'block';
        cleanPreview.src = 'mockdata2';
        cleanPreview.style.display = 'block';
        addButton.disabled = false;
        
        addButton.click();
        
        expect(window.addToDataset).toHaveBeenCalled();
    });
    
    test('Bulk import button should create file input when clicked', () => {
        // Mock createElement and click methods
        const mockFileInput = {
            type: null,
            accept: null,
            multiple: false,
            click: jest.fn()
        };
        
        document.createElement = jest.fn(() => mockFileInput);
        
        bulkImportBtn.click();
        
        expect(document.createElement).toHaveBeenCalledWith('input');
        expect(mockFileInput.type).toBe('file');
        expect(mockFileInput.accept).toBe('image/*');
        expect(mockFileInput.multiple).toBe(true);
        expect(mockFileInput.click).toHaveBeenCalled();
    });
});
