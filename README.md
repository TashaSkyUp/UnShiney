# UnShiney Web Demo

A web demonstration of the UnShiney image processing project, which uses neural networks to remove shine, glare, and reflections from images.

## Features

- Upload and process your own images
- Multiple model architectures to choose from
- Interactive training simulation
- Before/after comparison view

## Installation

1. Install the required dependencies:
```
pip install -r requirements.txt
```

2. Start the Flask application:
```
python app.py
```

3. Open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

## How It Works

The web demo simulates the UnShiney neural network models. When you upload an image, it is:

1. Converted to grayscale
2. Resized to a uniform size
3. Processed through your chosen model type
4. Displayed with the "shine" removed

## Available Models

- **Fully Connected**: Dense neural network that processes the entire image at once
- **Convolutional**: Uses convolutional layers for processing
- **Hybrid**: Combines convolutional and dense layers
