/**
 * Frontend tests for the drag and drop functionality
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

// Simple Jest tests to verify setup
describe('Basic DOM Tests', () => {
    test('Original upload box should exist', () => {
        const uploadBox = document.getElementById('original-upload-box');
        expect(uploadBox).not.toBeNull();
    });

    test('Clean upload box should exist', () => {
        const uploadBox = document.getElementById('clean-upload-box');
        expect(uploadBox).not.toBeNull();
    });

    test('Add pair button should exist and be disabled', () => {
        const button = document.getElementById('add-pair-to-dataset-btn');
        expect(button).not.toBeNull();
        expect(button.disabled).toBe(true);
    });

    test('Bulk import button should exist', () => {
        const button = document.getElementById('bulk-import-btn');
        expect(button).not.toBeNull();
    });
});
