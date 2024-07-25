from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import yaml
import os

app = Flask(__name__)
CORS(app)

@app.route('/generate-config', methods=['POST'])
def generate_config():
    data = request.json
    with open('config.yaml', 'w') as file:
        yaml.dump(data, file, default_flow_style=False)
    return jsonify({'message': 'Config generated successfully!'})

@app.route('/download-config', methods=['GET'])
def download_config():
    path = 'config.yaml'
    return send_file(path, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
