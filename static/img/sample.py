import numpy as np
from PIL import Image
import os

def create_sample_image():
    size = 64
    x = np.linspace(0, 1, size)
    y = np.linspace(0, 1, size)
    xx, yy = np.meshgrid(x, y)
    
    # Input: Gradient with shine
    input_img = (xx * yy * 255).astype(np.uint8)
    shine = np.exp(-((xx-0.7)**2 + (yy-0.3)**2)/0.05) * 200
    input_img = np.clip(input_img + shine.astype(np.uint8), 0, 255).astype(np.uint8)
    
    # Convert to PIL Image and save
    input_pil = Image.fromarray(input_img)
    input_pil = input_pil.resize((256, 256), Image.LANCZOS)
    input_pil.save('sample1.png')
    
    # Circle with shine
    xx, yy = np.meshgrid(np.linspace(-1, 1, size), np.linspace(-1, 1, size))
    circle = ((xx**2 + yy**2) < 0.5**2).astype(np.float32)
    
    # Add shine
    shine = np.exp(-((xx-0.2)**2 + (yy-0.2)**2)/0.05) * 200
    input_img = np.clip(circle * 200 + shine, 0, 255).astype(np.uint8)
    
    # Convert to # Let's check what files we've successfully created
ls -la static/js/
ls -la model/

# Let's verify the templates/index.html makes reference to the correct JS file
grep -n "script.js" templates/index.html

# Let's also check if there are any issues with the app.py file
# It should import from the model module
grep -n "import.*model" app.py

# Fix app.py if needed to properly import the model
cat > app.py << 'EOF'
from flask import Flask, render_template, request, jsonify
import os
import numpy as np
import base64
import io
from PIL import Image
from model.model import UnShineyModel
from model.utils import preprocess_image, image_to_base64

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

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
    
    # Get image from request
    img = Image.open(file.stream)
    
    # Process image through the selected model
    processed_img = process_with_model(img, model_type)
    
    # Return base64 encoded image
    img_buffer = io.BytesIO()
    processed_img.save(img_buffer, format='PNG')
    img_str = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    return jsonify({
        'processed_image': f'data:image/png;base64,{img_str}'
    })

@app.route('/train', methods=['POST'])
def train_model():
    # Simulate training process - in a real app, this would train on user data
    return jsonify({'status': 'Model trained successfully'})

def process_with_model(image, model_type):
    """
    Process an image using the specified model type.
    """
    # Convert to grayscale and resize
    image = image.convert('L')
    image = image.resize((64, 64), Image.LANCZOS)
    
    # Get image data as numpy array
    img_array = np.array(image)
    
    # Use our UnShineyModel to process the image
    model = UnShineyModel(model_type)
    processed_array = model.process_image(img_array)
    
    # Convert back to PIL Image
    return Image.fromarray(processed_array)

if __name__ == '__main__':
    # Make sure dependencies are installed
    try:
        import scipy
        import skimage
    except ImportError:
        print("Installing required packages...")
        import pip
        pip.main(['install', 'scipy', 'scikit-image'])
    
    app.run(debug=True)
