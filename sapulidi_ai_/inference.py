import os
import io
import numpy as np
import tensorflow as tf
import keras
from PIL import Image

# ==============================================================================
# CUSTOM KERAS LAYER REGISTER
# ==============================================================================
@keras.saving.register_keras_serializable()
class CustomDenseClassifier(keras.layers.Layer):
    def __init__(self, units=128, num_classes=3, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.num_classes = num_classes
        self.batch_norm = keras.layers.BatchNormalization(name='batch_norm')
        self.dense_hidden = keras.layers.Dense(units, activation='relu', name='dense_hidden')
        self.dropout = keras.layers.Dropout(0.5, name='dropout')
        self.dense_output = keras.layers.Dense(num_classes, activation='softmax', name='dense_output')
        
        # Pre-build the sub-layers so their weight variables exist during deserialization
        self.dense_hidden.build([None, 1280])
        self.batch_norm.build([None, units])
        self.dense_output.build([None, units])

    def call(self, inputs, training=None):
        x = self.dense_hidden(inputs)
        x = self.batch_norm(x, training=training)
        x = self.dropout(x, training=training)
        return self.dense_output(x)

    def get_config(self):
        config = super().get_config()
        config.update({
            "units": self.units,
            "num_classes": self.num_classes,
        })
        return config

# ==============================================================================
# KONFIGURASI GLOBAL
# ==============================================================================
# Sesuaikan urutan kelas dengan yang ada di dataset Colab kamu
CLASS_NAMES = ['ringan', 'sedang', 'berat'] 
IMG_SIZE = (224, 224)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, 'models', 'model-v1.keras')

# Variabel global untuk menyimpan model di memori
# Ini memastikan model tidak di-load berulang kali setiap ada user yang upload foto
_model_instance = None

# ==============================================================================
# FUNGSI MEMUAT MODEL (Dijalankan saat FastAPI Startup)
# ==============================================================================
def load_damage_model():
    """
    Memuat model .keras ke dalam memori.
    Fungsi ini idealnya dipanggil pada event @app.on_event("startup") di FastAPI.
    """
    global _model_instance
    if _model_instance is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"File model tidak ditemukan di jalur: {MODEL_PATH}")
        
        print(f"Memuat model {MODEL_PATH} ke memori...")
        _model_instance = keras.models.load_model(MODEL_PATH, custom_objects={'CustomDenseClassifier': CustomDenseClassifier})
        print("Model berhasil siap digunakan!")
        
    return _model_instance

# ==============================================================================
# FUNGSI UTAMA INFERENCE (Dijalankan di Endpoint FastAPI)
# ==============================================================================
def predict_building_damage(image_bytes: bytes) -> dict:
    """
    Menerima file gambar dalam bentuk bytes, memprosesnya, dan mengembalikan 
    hasil klasifikasi dalam format dictionary (JSON friendly).
    """
    # 1. Pastikan model sudah dimuat
    model = load_damage_model()
    
    # 2. Baca file bytes menjadi objek Gambar (Image)
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"File tidak valid atau bukan gambar: {str(e)}")

    # 3. Preprocessing: Konversi ke RGB (Penting untuk mengatasi gambar PNG/Transparan)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    # 4. Preprocessing: Resize dan konversi ke Tensor
    img = img.resize(IMG_SIZE)
    img_array = tf.keras.utils.img_to_array(img)
    
    # 5. Tambahkan dimensi batch (dari (224, 224, 3) menjadi (1, 224, 224, 3))
    img_batch = tf.expand_dims(img_array, 0)
    
    # 6. Lakukan Prediksi
    predictions = model.predict(img_batch)
    
    # Karena kita menggunakan Custom Layer dengan aktivasi 'softmax',
    # output sudah berupa probabilitas dari 0.0 hingga 1.0 untuk tiap kelas
    scores = predictions[0] 
    
    # 7. Ekstrak Hasil
    class_index = np.argmax(scores)
    predicted_class = CLASS_NAMES[class_index]
    confidence_score = float(scores[class_index]) * 100
    
    # 8. Susun format balasan (Dictionary siap dikonversi ke JSON oleh FastAPI)
    result = {
        "status": "success",
        "prediksi": predicted_class,
        "confidence_percentage": round(confidence_score, 2),
        "detail_probabilitas": {
            CLASS_NAMES[i]: round(float(scores[i]) * 100, 2) for i in range(len(CLASS_NAMES))
        }
    }
    
    return result