from flask import Flask, render_template, request, jsonify, send_file
import os
import numpy as np
import base64
import io
import json
import time
from PIL import Image
from datetime import datetime
from model.model import UnShineyModel
from model.utils import preprocess_image, image_to_base64

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max upload
app.config['DATASET_FOLDER'] = 'datasets'
app.config['MODEL_CONFIG_FOLDER'] = 'model_configs'

# Create folders if they don't exist
os.makedirs(app.config['DATASET_FOLDER'], exist_ok=True)
os.makedirs(app.config['MODEL_CONFIG_FOLDER'], exist_ok=True)

# Store active models in memory
active_models = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    model_type = request.form.get('model_type', 'dense')
    model_config = None
    
    # Check if custom model configuration was provided
    if 'model_config' in request.form:
        try:
            model_config = json.loads(request.form.get('model_config'))
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid model configuration'}), 400
    
    # Get image from request
    img = Image.open(file.stream)
    
    # Process image through the selected model
    processed_img = process_with_model(img, model_type, model_config)
    
    # Return base64 encoded image
    img_buffer = io.BytesIO()
    processed_img.save(img_buffer, format='PNG')
    img_str = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    return jsonify({
        'processed_image': f'data:image/png;base64,{img_str}',
        'processing_time': f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    })

@app.route('/train', methods=['POST'])
def train_model():
    data = request.json
    
    required_fields = ['model_type', 'epochs', 'batch_size', 'learning_rate']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required training parameters'}), 400
    
    model_type = data['model_type']
    epochs = int(data['epochs'])
    batch_size = int(data['batch_size'])
    learning_rate = float(data['learning_rate'])
    model_config = data.get('model_config', None)
    dataset_id = data.get('dataset_id', None)
    validation_split = float(data.get('validation_split', 0.2))
    
    # Generate a model ID
    model_id = f"model_{model_type}_{int(time.time())}"
    
    # Create model name based on parameters
    model_name = f"{model_type.capitalize()} Model ({epochs} epochs)"
    if 'name' in data and data['name']:
        model_name = data['name']
    
    # Initialize training history to simulate progress
    training_history = {
        'loss': [],
        'val_loss': []
    }
    
    # Simulate training process with decreasing loss values
    for i in range(epochs):
        # Simulated decreasing loss over epochs with some randomness
        train_loss = 0.5 * (1 - (i / epochs)) + 0.05 * np.random.random()
        val_loss = train_loss * (1.2 - 0.2 * (i / epochs)) + 0.08 * np.random.random()
        
        training_history['loss'].append(round(train_loss, 4))
        training_history['val_loss'].append(round(val_loss, 4))
    
    # Simulate training success
    training_results = {
        'model_id': model_id,
        'model_name': model_name,
        'status': 'success',
        'epochs_completed': epochs,
        'final_loss': training_history['loss'][-1],
        'final_val_loss': training_history['val_loss'][-1],
        'training_time': f"{epochs * 2} seconds",
        'history': training_history
    }
    
    # Save model configuration
    if model_config:
        # Add training parameters to the configuration
        full_config = model_config if isinstance(model_config, dict) else json.loads(model_config)
        full_config.update({
            'training': {
                'epochs': epochs,
                'batch_size': batch_size,
                'learning_rate': learning_rate,
                'validation_split': validation_split,
                'dataset_id': dataset_id,
                'completed_at': datetime.now().isoformat()
            },
            'name': model_name,
            'model_id': model_id,
            'type': model_type,
            'history': training_history
        })
        
        config_path = os.path.join(app.config['MODEL_CONFIG_FOLDER'], f"{model_id}.json")
        with open(config_path, 'w') as f:
            json.dump(full_config, f, indent=2)
        
        training_results['config_saved'] = True
    
    # Create a simulated model and store it in memory
    active_models[model_id] = {
        'id': model_id,
        'name': model_name,
        'type': model_type,
        'config': full_config if model_config else None,
        'created_at': datetime.now().isoformat(),
        'history': training_history
    }
    
    # Add sample processing results for this model
    # This simulates how different models might process the same image differently
    sample_results = []
    
    # Create sample images with different processing parameters based on model type
    from model.utils import generate_sample_images
    samples = generate_sample_images(count=1)
    
    if samples:
        for i, (input_img, _) in enumerate(samples):
            # Process the sample with the "model"
            model = UnShineyModel(model_type=model_type)
            processed_array = model.process_image(np.array(input_img.convert('L')))
            processed_img = Image.fromarray(processed_array)
            
            # Convert to base64 for response
            sample_result = {
                'input': image_to_base64(input_img),
                'output': image_to_base64(processed_img)
            }
            sample_results.append(sample_result)
    
    training_results['sample_results'] = sample_results
    
    return jsonify(training_results)

@app.route('/models', methods=['GET'])
def list_models():
    """List all saved model configurations"""
    model_files = [f for f in os.listdir(app.config['MODEL_CONFIG_FOLDER']) if f.endswith('.json')]
    models = []
    
    for file in model_files:
        path = os.path.join(app.config['MODEL_CONFIG_FOLDER'], file)
        try:
            with open(path, 'r') as f:
                config = json.load(f)
                models.append({
                    'id': file.replace('.json', ''),
                    'name': config.get('name', 'Unnamed Model'),
                    'type': config.get('type', 'custom'),
                    'description': config.get('description', ''),
                    'created_at': datetime.fromtimestamp(os.path.getctime(path)).isoformat()
                })
        except:
            # Skip invalid configs
            continue
    
    return jsonify(models)

@app.route('/models/<model_id>', methods=['GET'])
def get_model(model_id):
    """Get a specific model configuration"""
    file_path = os.path.join(app.config['MODEL_CONFIG_FOLDER'], f"{model_id}.json")
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'Model not found'}), 404
    
    with open(file_path, 'r') as f:
        config = json.load(f)
    
    return jsonify(config)

@app.route('/datasets', methods=['GET'])
def list_datasets():
    """List all saved datasets"""
    dataset_files = [f for f in os.listdir(app.config['DATASET_FOLDER']) if f.endswith('.json')]
    datasets = []
    
    for file in dataset_files:
        path = os.path.join(app.config['DATASET_FOLDER'], file)
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                datasets.append({
                    'id': file.replace('.json', ''),
                    'name': file.replace('.json', ''),
                    'item_count': len(data),
                    'created_at': datetime.fromtimestamp(os.path.getctime(path)).isoformat()
                })
        except:
            # Skip invalid datasets
            continue
    
    return jsonify(datasets)

@app.route('/datasets/<dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """Get a specific dataset"""
    file_path = os.path.join(app.config['DATASET_FOLDER'], f"{dataset_id}.json")
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'Dataset not found'}), 404
    
    with open(file_path, 'r') as f:
        dataset = json.load(f)
    
    # Truncate base64 data to save bandwidth in the response
    truncated_dataset = []
    for item in dataset:
        truncated_dataset.append({
            'id': item.get('id', ''),
            'original': item.get('original', '')[:100] + '...',
            'clean': item.get('clean', '')[:100] + '...'
        })
    
    return jsonify({
        'id': dataset_id,
        'item_count': len(dataset),
        'preview': truncated_dataset
    })

@app.route('/datasets', methods=['POST'])
def save_dataset():
    """Save a dataset"""
    if not request.is_json:
        return jsonify({'error': 'Expected JSON payload'}), 400
    
    data = request.json
    
    if not isinstance(data, list):
        return jsonify({'error': 'Dataset must be an array'}), 400
    
    # Generate a dataset ID if not provided
    dataset_id = request.args.get('id') or f"dataset_{int(time.time())}"
    
    # Save dataset
    file_path = os.path.join(app.config['DATASET_FOLDER'], f"{dataset_id}.json")
    with open(file_path, 'w') as f:
        json.dump(data, f)
    
    return jsonify({
        'status': 'success',
        'id': dataset_id,
        'item_count': len(data)
    })

@app.route('/generate_synthetic_dataset', methods=['POST'])
def generate_synthetic_dataset():
    """Generate a synthetic dataset for testing"""
    from model.utils import generate_sample_images
    
    # Generate sample image pairs
    samples = generate_sample_images()
    
    # Convert to dataset format
    dataset = []
    for i, (input_img, target_img) in enumerate(samples):
        # Convert PIL images to base64
        input_base64 = image_to_base64(input_img)
        target_base64 = image_to_base64(target_img)
        
        dataset.append({
            'id': i,
            'original': f'data:image/png;base64,{input_base64}',
            'clean': f'data:image/png;base64,{target_base64}'
        })
    
    # Generate a dataset ID
    dataset_id = f"synthetic_dataset_{int(time.time())}"
    
    # Save dataset
    file_path = os.path.join(app.config['DATASET_FOLDER'], f"{dataset_id}.json")
    with open(file_path, 'w') as f:
        json.dump(dataset, f)
    
    return jsonify({
        'status': 'success',
        'id': dataset_id,
        'item_count': len(dataset)
    })

@app.route('/process_marked_area', methods=['POST'])
def process_marked_area():
    """Process an image with marked areas to generate a clean version"""
    if not request.is_json:
        return jsonify({'error': 'Expected JSON payload'}), 400
    
    data = request.json
    
    if 'image' not in data or 'mask' not in data:
        return jsonify({'error': 'Image and mask data required'}), 400
    
    # In a real app, we would use the mask to clean the image
    # Here we just simulate it by returning the original without the red marks
    
    try:
        # Decode base64 strings
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        original_img = Image.open(io.BytesIO(image_bytes))
        
        # Create a simulated "clean" version
        # This is just a placeholder - in a real app this would use the mask
        # to intelligently remove the marked shine/glare
        clean_img = original_img.convert('L')
        clean_img = clean_img.filter(ImageFilter.GaussianBlur(radius=1))
        
        # Convert back to base64
        clean_buffer = io.BytesIO()
        clean_img.save(clean_buffer, format='PNG')
        clean_base64 = base64.b64encode(clean_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'status': 'success',
            'clean_image': f'data:image/png;base64,{clean_base64}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_with_model(image, model_type, model_config=None):
    """
    Process an image using the specified model type and configuration.
    
    Args:
        image: PIL Image to process
        model_type: Type of model to use (dense, conv, hybrid, custom)
        model_config: Optional custom model configuration
    
    Returns:
        Processed PIL Image
    """
    # Convert to grayscale and resize
    image = image.convert('L')
    image = image.resize((64, 64), Image.LANCZOS)
    
    # Get image data as numpy array
    img_array = np.array(image)
    
    # If model_config is provided and has custom processing parameters
    if model_config and 'processing_params' in model_config:
        params = model_config['processing_params']
        
        # Example custom processing logic based on parameters
        if 'contrast' in params:
            contrast = float(params['contrast'])
            img_array = np.clip((img_array.astype(float) * contrast), 0, 255).astype(np.uint8)
        
        if 'brightness' in params:
            brightness = float(params['brightness'])
            img_array = np.clip(img_array.astype(float) + brightness, 0, 255).astype(np.uint8)
        
        if 'blur' in params:
            from scipy import ndimage
            blur = float(params['blur'])
            img_array = ndimage.gaussian_filter(img_array, sigma=blur)
        
    else:
        # Apply different processing based on model type
        if model_type == 'dense':
            # Simulate dense model by adjusting contrast
            img_array = np.clip((img_array.astype(float) * 1.2), 0, 255).astype(np.uint8)
            
        elif model_type == 'conv':
            # Simulate conv model with edge enhancement and slight blur
            from scipy import ndimage
            img_array = ndimage.gaussian_filter(img_array, sigma=1)
            
            # Apply edge enhancement
            from scipy.ndimage import sobel
            edge_h = sobel(img_array, axis=0)
            edge_v = sobel(img_array, axis=1)
            magnitude = np.sqrt(edge_h**2 + edge_v**2)
            
            # Blend original with edge enhancement
            img_array = np.clip(img_array.astype(float) * 0.8 + magnitude * 0.2, 0, 255).astype(np.uint8)
            
        elif model_type == 'hybrid':
            # Simulate hybrid model with histogram equalization and edge preservation
            from skimage import exposure
            from scipy import ndimage
            
            # Histogram equalization
            img_array = exposure.equalize_hist(img_array) * 255
            
            # Edge preservation
            edge_preserving = ndimage.gaussian_filter(img_array, sigma=0.5)
            img_array = edge_preserving.astype(np.uint8)
            
        elif model_type == 'custom':
            # Simulate a custom model with multiple effects
            from scipy import ndimage
            from skimage import exposure
            
            # Apply a combination of effects
            img_array = ndimage.gaussian_filter(img_array, sigma=0.8)
            img_array = exposure.adjust_gamma(img_array, gamma=0.8)
            
            # Apply a slight sharpening
            blurred = ndimage.gaussian_filter(img_array, sigma=1.0)
            highpass = img_array - blurred
            img_array = np.clip(img_array + highpass * 0.5, 0, 255).astype(np.uint8)
    
    # Convert back to PIL Image
    return Image.fromarray(img_array)

if __name__ == '__main__':
    # Make sure dependencies are installed
    try:
        import scipy
        import skimage
        from PIL import ImageFilter
    except ImportError:
        print("Installing required packages...")
        import pip
        pip.main(['install', 'scipy', 'scikit-image', 'pillow'])
        from PIL import ImageFilter
    
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║               UnShiney Web Demo Starting                  ║")
    print("║                                                           ║")
    print("║  * Upload image pairs (with shine and without)            ║")
    print("║  * Customize and train your own models                    ║")
    print("║  * Process new images to remove unwanted reflections      ║")
    print("║                                                           ║") 
    print("║  Server running at: http://127.0.0.1:5000/                ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    app.run(debug=True)
